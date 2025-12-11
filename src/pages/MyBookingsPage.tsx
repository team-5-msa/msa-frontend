import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import type { Booking } from "../types";
import "./MyBookingsPage.css";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyBookings();
      // Sort by creation date (newest first)
      const sorted = data.sort(
        (a, b) => b.createdAt._seconds - a.createdAt._seconds
      );
      setBookings(sorted);
    } catch (err) {
      setError(
        (err as Error).message || "예매 내역을 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("정말 예매를 취소하시겠습니까?")) return;

    try {
      setCancellingId(bookingId);
      await apiService.cancelBooking(bookingId);

      // Update local state immediately to reflect cancellation
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.bookingId === bookingId
            ? { ...booking, status: "CANCELLED" as const }
            : booking
        )
      );

      alert("예매가 취소되었습니다.");
    } catch (err: unknown) {
      const axiosErr = err as Record<string, unknown> & {
        response?: { data?: { message?: string } };
      };
      alert(
        axiosErr.response?.data?.message ||
          (err as Error).message ||
          "예매 취소에 실패했습니다."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDDING: { label: "결제 대기", className: "status-pending" },
      PAID: { label: "결제 완료", className: "status-paid" },
      SUCCESS: { label: "결제 완료", className: "status-paid" },
      CANCELLED: { label: "취소됨", className: "status-cancelled" },
      FAILED: { label: "결제 실패", className: "status-failed" },
      REFUNDED: { label: "환불됨", className: "status-refunded" },
    };
    return badges[status] || { label: status, className: "" };
  };

  const formatDate = (timestamp: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>예매 내역을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={loadBookings}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="page-header">
        <h1>🎫 예매 내역</h1>
        <p>나의 예매 내역을 확인하세요</p>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>예매 내역이 없습니다</h3>
          <p>공연을 예매하고 즐거운 시간을 보내세요!</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const status = getStatusBadge(booking.status);
            const canCancel =
              booking.status === "PENDING" || booking.status === "PAID";

            return (
              <div key={booking.bookingId} className="booking-card">
                <div className="booking-header">
                  <div className="booking-id">
                    예매번호: {booking.bookingId}
                  </div>
                  <div className={`booking-status ${status.className}`}>
                    {status.label}
                  </div>
                </div>

                <div className="booking-content">
                  <div className="booking-info">
                    <div className="info-row">
                      <span className="info-icon">🎭</span>
                      <div>
                        <div className="info-label">공연 ID</div>
                        <div className="info-value">
                          {booking.performanceId}
                        </div>
                      </div>
                    </div>

                    <div className="info-row">
                      <span className="info-icon">🎫</span>
                      <div>
                        <div className="info-label">좌석 수</div>
                        <div className="info-value">{booking.quantity}석</div>
                      </div>
                    </div>

                    {booking.seatIds && booking.seatIds.length > 0 && (
                      <div className="info-row">
                        <span className="info-icon">💺</span>
                        <div>
                          <div className="info-label">좌석 번호</div>
                          <div className="info-value">
                            {booking.seatIds.join(", ")}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="info-row">
                      <span className="info-icon">💳</span>
                      <div>
                        <div className="info-label">결제 방법</div>
                        <div className="info-value">
                          {booking.paymentMethod}
                        </div>
                      </div>
                    </div>

                    <div className="info-row">
                      <span className="info-icon">💰</span>
                      <div>
                        <div className="info-label">결제 금액</div>
                        <div className="info-value price">
                          {booking.totalAmount.toLocaleString()}원
                        </div>
                      </div>
                    </div>

                    {booking.reservationId && (
                      <div className="info-row">
                        <span className="info-icon">📋</span>
                        <div>
                          <div className="info-label">예약 번호</div>
                          <div className="info-value">
                            {booking.reservationId}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="booking-footer">
                    <div className="booking-date">
                      <div className="date-label">예매일</div>
                      <div className="date-value">
                        {formatDate(booking.createdAt)}
                      </div>
                    </div>

                    {canCancel && (
                      <button
                        className="btn btn-danger btn-cancel"
                        onClick={() => handleCancelBooking(booking.bookingId)}
                        disabled={cancellingId === booking.bookingId}
                      >
                        {cancellingId === booking.bookingId ? (
                          <>
                            <span className="loading"></span>
                            취소 중...
                          </>
                        ) : (
                          "예매취소"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
