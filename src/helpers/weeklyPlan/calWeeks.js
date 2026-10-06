export function getCurrentWeekDetails() {
    const now = new Date();

    // Tính toán số tuần theo chuẩn ISO-8601
    const target = new Date(now.valueOf());
    // Đưa ngày về chuẩn ISO: Thứ 2 = 0, Thứ 3 = 1, ..., Chủ Nhật = 6
    const dayNr = (now.getDay() + 6) % 7;

    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();

    target.setMonth(0, 4);
    const dayDiff = (firstThursday - target) / 86400000;
    const weekNumber = 1 + Math.ceil(dayDiff / 7);

    // 2. Tính ngày bắt đầu (Thứ Hai) và ngày kết thúc (Chủ Nhật)
    const startOfWeek = new Date(now);
    // Trừ đi số ngày lệch để ép về chính xác ngày Thứ Hai đầu tuần
    startOfWeek.setDate(now.getDate() - dayNr);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    // Thứ Hai + 6 ngày = Chủ Nhật
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
        weekNumber: weekNumber,
        date_start: startOfWeek.toDateString(), // Sẽ ra: "Mon Aug 31 2026"
        date_end: endOfWeek.toDateString()     // Sẽ ra: "Sun Sep 06 2026"
    };
}

// Hàm hỗ trợ format ngày ra dạng YYYY-MM-DD chuẩn cho Supabase
export const formatDateForDB = (dateObj) => {
    const d = new Date(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Kết quả: "2026-08-31"
};


// Tính tuần tiếp theo 
export function getNextWeekDetailsFromDate(lastEndDateStr, lastWeekNum) {
    // Lấy ngày bắt đầu tuần mới = ngày kết thúc tuần cũ + 1 ngày
    const startDate = new Date(lastEndDateStr);
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    // Ngày kết thúc = ngày bắt đầu + 6 ngày
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return {
        weekNumber: lastWeekNum + 1,
        date_start: startDate,
        date_end: endDate
    };
}

