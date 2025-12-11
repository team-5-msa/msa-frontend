import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/api";
import type { Performance } from "../types";
import "./BookingPage.css";

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { performance, seatCount } = location.state as {
    performance: Performance;
    seatCount: number;
  };

  const [step, setStep] = useState<"reserve" | "payment" | "complete">(
    "reserve"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bookingId, setBookingId] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");

  const handleReservation = async () => {
    try {
      setLoading(true);
      setError("");

      // Step 1: Create booking
      const bookingResponse = await apiService.createBooking({
        performanceId: performance.id.toString(),
        quantity: seatCount,
        paymentMethod: "CREDIT_CARD",
      });

      setBookingId(bookingResponse.bookingId);
      setStep("payment");
    } catch (err: unknown) {
      const axiosErr = err as Record<string, unknown> & {
        response?: { status?: number; data?: { message?: string } };
      };

      if (axiosErr.response?.status === 409) {
        setError("한 계정당 10매 이상 예약할 수 없습니다.");
      } else {
        setError(
          axiosErr.response?.data?.message ||
            (err as Error).message ||
            "예약에 실패했습니다."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setError("");

      // Execute payment
      const paymentResponse = await apiService.executePayment({
        bookingId,
        paymentMethodToken: "creditCard",
        cardNumber,
        cvv,
      });

      if (paymentResponse.finalStatus === "SUCCESS") {
        setStep("complete");
      } else {
        throw new Error("결제에 실패했습니다.");
      }
    } catch (err: unknown) {
      const axiosErr = err as Record<string, unknown> & {
        response?: { data?: { message?: string } };
      };
      const errorMsg =
        axiosErr.response?.data?.message ||
        (err as Error).message ||
        "결제에 실패했습니다.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingId) return;

    if (!window.confirm("예약을 취소하시겠습니까?")) return;

    try {
      setLoading(true);
      await apiService.cancelBooking(bookingId);
      navigate(`/performances/${id}`);
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      setError("예약 취소에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join("-") || cleaned;
    return formatted.slice(0, 19); // 1234-5678-9012-3456
  };

  const totalPrice = performance.price * seatCount;

  return (
    <div className="booking-page">
      <button
        className="btn-back"
        onClick={() => navigate(`/performances/${id}`)}
      >
        ← 뒤로가기
      </button>

      <div className="booking-container">
        {/* Progress Steps */}
        <div className="progress-steps">
          <div
            className={`step ${step === "reserve" ? "active" : "completed"}`}
          >
            <div className="step-number">1</div>
            <div className="step-label">예약 확인</div>
          </div>
          <div className="step-divider"></div>
          <div
            className={`step ${
              step === "payment"
                ? "active"
                : step === "complete"
                ? "completed"
                : ""
            }`}
          >
            <div className="step-number">2</div>
            <div className="step-label">결제</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${step === "complete" ? "active" : ""}`}>
            <div className="step-number">3</div>
            <div className="step-label">완료</div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="booking-summary">
          <h2>예매 정보</h2>
          <div className="summary-content">
            <div className="summary-row">
              <span className="summary-label">공연명</span>
              <span className="summary-value">{performance.title}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">공연장</span>
              <span className="summary-value">{performance.venue}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">좌석 수</span>
              <span className="summary-value">{seatCount}석</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">좌석당 가격</span>
              <span className="summary-value">
                {performance.price.toLocaleString()}원
              </span>
            </div>
            <div className="summary-row total">
              <span className="summary-label">총 결제 금액</span>
              <span className="summary-value total-price">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Reservation */}
        {step === "reserve" && (
          <div className="step-content">
            <h2>예약 확인</h2>
            <p className="step-description">
              위 정보로 예약을 진행하시겠습니까?
              <br />
              예약 후 10분 이내에 결제를 완료해주세요.
            </p>

            {error && <div className="error-message">{error}</div>}

            <button
              className="btn btn-primary btn-block"
              onClick={handleReservation}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading"></span>
                  예약 중...
                </>
              ) : (
                "예약하기"
              )}
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === "payment" && bookingId && (
          <div className="step-content">
            <h2>결제 정보</h2>

            <div className="reservation-info">
              <div className="info-badge success">
                ✓ 예약이 완료되었습니다 (예약번호: {bookingId})
              </div>
              <p className="reservation-notice">
                10분 이내에 결제를 완료해주세요. 시간 초과 시 예약이 자동으로
                취소됩니다.
              </p>
            </div>

            <div className="payment-form">
              <div className="form-group">
                <label htmlFor="cardNumber">카드 번호</label>
                <input
                  type="text"
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  placeholder="1234-5678-9012-3456"
                  maxLength={19}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  placeholder="123"
                  maxLength={3}
                  required
                />
                <span className="form-hint">
                  💡 끝자리가 0, 1, 9면 성공 / 2~8은 실패 (테스트용)
                </span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div
              className="payment-actions"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <button
                className="btn btn-primary btn-block"
                onClick={handlePayment}
                disabled={loading || !cardNumber || !cvv}
              >
                {loading ? (
                  <>
                    <span className="loading"></span>
                    결제 중...
                  </>
                ) : (
                  `${totalPrice.toLocaleString()}원 결제하기`
                )}
              </button>
              <button
                className="btn btn-secondary btn-block"
                onClick={handleCancel}
                disabled={loading}
              >
                예약 취소
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === "complete" && (
          <div className="step-content complete">
            <div className="success-icon">✓</div>
            <h2>예매가 완료되었습니다!</h2>
            <p className="complete-message">
              예매 내역은 '예매 내역' 페이지에서 확인하실 수 있습니다.
            </p>

            <div className="complete-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/my-bookings")}
              >
                예매 내역 보기
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/performances")}
              >
                공연 목록으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
