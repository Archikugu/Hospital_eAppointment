import { Component, OnInit, computed, signal, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { SwalService } from '../../core/services/swal.service';
import { Subscription } from 'rxjs';
import { TzDatePipe } from '../../core/pipes/tz-date.pipe';

type DaySlot = {
    time: string; // e.g. "09:00"
    isBusy: boolean;
    title?: string; // appointment title/patient name
    appointmentId?: string;
    patientName?: string;
    note?: string;
};

type DayAvailability = {
    date: Date;
    slots: DaySlot[];
};

type DoctorOption = {
    id: string;
    name: string;
    department?: string;
};

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [CommonModule, FormsModule, TzDatePipe],
    templateUrl: './appointments.component.html',
    styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
    isLoading = false;
    errorMessage = '';

    // Doctors
    doctors: DoctorOption[] = [];
    filteredDoctors: DoctorOption[] = [];
    selectedDoctorId: string | undefined;
    departments: string[] = [];
    selectedDepartment: string | undefined;

    // Week state
    weekStart = signal<Date>(this.getStartOfWeek(new Date()));
    weekEnd = computed(() => {
        const start = this.weekStart();
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return end;
    });

    // Availability grid (Mon..Sun)
    weekDays = computed<DayAvailability[]>(() => this.generateWeek(this.weekStart()));

    // Time slots configuration
    timeSlots: string[] = [
        '09:00','09:30','10:00','10:30','11:00','11:30',
        '13:00','13:30','14:00','14:30','15:00','15:30','16:00'
    ];

    // View modes: day | week | month
    viewMode: 'day' | 'week' | 'month' = 'week';
    selectedDay: Date = new Date();

    private availabilitySub?: Subscription;
    private availabilityCache = new Map<string, DayAvailability[]>();

    // Popover state for busy slots
    popoverVisible = false;
    popoverSlot?: DaySlot;
    popoverDay?: DayAvailability;
    popoverSlotIndex?: number; // Track slot index for positioning
    private isClickingSlot = false; // Flag to prevent document click from closing popover immediately
    private popoverOpeningTime = 0; // Timestamp when popover was opened

    // Note editing state
    editingNote = false;
    noteText = '';
    editingSlotId?: string;

    constructor(private http: HttpService, private swal: SwalService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        // restore only week selection; do not auto-select any doctor
        const savedWeekStart = localStorage.getItem('appointments.weekStart');
        if (savedWeekStart) {
            const d = new Date(savedWeekStart);
            if (!isNaN(d.getTime())) this.weekStart.set(this.getStartOfWeek(d));
        }
        this.selectedDoctorId = undefined;
        this.loadDoctors();
        this.loadAvailability();
    }

    ngOnDestroy(): void {
        this.availabilitySub?.unsubscribe();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        // If we're clicking a slot, ignore this click completely
        if (this.isClickingSlot) {
            return;
        }
        
        // Ignore clicks within 200ms of opening popover (prevent immediate closure)
        if (Date.now() - this.popoverOpeningTime < 200) {
            return;
        }
        
        // Close popover if clicking outside of it
        if (this.popoverVisible) {
            const target = event.target as HTMLElement;
            const popover = document.querySelector('.slot-popover');
            const busySlot = target.closest('.slot-col.busy');
            const slotCol = target.closest('.slot-col');
            
            // Don't close if clicking on popover, busy slot, or any slot-col
            if (popover && !popover.contains(target) && !busySlot && !slotCol) {
                this.popoverVisible = false;
                this.popoverSlot = undefined;
                this.popoverDay = undefined;
                this.cancelEditNote();
            }
        }
    }

    // Helpers
    private getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay(); // 0=Sun, 1=Mon, ...
        const diff = (day === 0 ? -6 : 1) - day; // make Monday the first day
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    private cloneDate(d: Date): Date {
        return new Date(d.getTime());
    }

    formatRange(): string {
        const s = this.weekStart();
        const e = this.weekEnd();
        const fmt = (x: Date) => x.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        return `${fmt(s)} - ${fmt(e)}`;
    }

    generateWeek(start: Date): DayAvailability[] {
        const cacheKey = new Date(start.getFullYear(), start.getMonth(), start.getDate()).toDateString();
        if (this.availabilityCache.has(cacheKey)) {
            // Return a shallow clone to avoid accidental external mutations of cache
            const cached = this.availabilityCache.get(cacheKey)!;
            return cached.map(d => ({
                date: new Date(d.date),
                slots: d.slots.map(s => ({ 
                    time: s.time, 
                    isBusy: s.isBusy, 
                    title: s.title,
                    appointmentId: s.appointmentId,
                    patientName: s.patientName,
                    note: s.note
                }))
            }));
        }
        const days: DayAvailability[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push({ date: d, slots: this.timeSlots.map(t => ({ time: t, isBusy: false })) });
        }
        return days;
    }

    prevWeek(): void {
        const s = this.cloneDate(this.weekStart());
        s.setDate(s.getDate() - 7);
        this.weekStart.set(s);
        localStorage.setItem('appointments.weekStart', this.weekStart().toISOString());
        this.loadAvailability();
    }

    nextWeek(): void {
        const s = this.cloneDate(this.weekStart());
        s.setDate(s.getDate() + 7);
        this.weekStart.set(s);
        localStorage.setItem('appointments.weekStart', this.weekStart().toISOString());
        this.loadAvailability();
    }

    today(): void {
        this.weekStart.set(this.getStartOfWeek(new Date()));
        localStorage.setItem('appointments.weekStart', this.weekStart().toISOString());
        this.loadAvailability();
        this.selectedDay = new Date();
    }

    // Data
    loadDoctors(): void {
        // Try to load doctors from API; if it fails, use graceful fallback
        this.http.get<any[]>(API_ENDPOINTS.DOCTORS?.GET_ALL ?? '/api/doctors').subscribe({
            next: (result) => {
                if ((result as any).isSuccess && (result as any).value) {
                    const list = (result as any).value as any[];
                    this.doctors = list.map(d => ({ id: d.id, name: `${d.firstName} ${d.lastName}`, department: d.department?.displayName || d.department?.name }));
                    this.computeDepartments();
                    this.applyDoctorFilter();
                    // keep user's choice; do not auto-select first doctor
                    if (this.selectedDoctorId && this.doctors.some(d => d.id === this.selectedDoctorId)) {
                        this.loadAvailability();
                    }
                } else if (Array.isArray(result)) {
                    this.doctors = result.map(d => ({ id: (d as any).id, name: `${(d as any).firstName} ${(d as any).lastName}`, department: (d as any).department?.displayName || (d as any).department?.name }));
                    this.computeDepartments();
                    this.applyDoctorFilter();
                    if (this.selectedDoctorId && this.doctors.some(d => d.id === this.selectedDoctorId)) {
                        this.loadAvailability();
                    }
                } else {
                    this.doctors = [];
                    this.filteredDoctors = [];
                }
            },
            error: () => {
                // Fallback mock list to keep UI usable
                this.doctors = [
                    { id: 'mock-1', name: 'Dr. Ada Lovelace', department: 'Cardiology' },
                    { id: 'mock-2', name: 'Dr. Alan Turing', department: 'Neurology' },
                    { id: 'mock-3', name: 'Dr. Marie Curie', department: 'Oncology' }
                ];
                this.computeDepartments();
                this.applyDoctorFilter();
            }
        });
    }

    loadAvailability(): void {
        this.isLoading = true;
        this.errorMessage = '';

        const startIso = this.formatLocalDate(this.weekStart());
        const doctorId = this.selectedDoctorId ?? '';

        // If doctorId is not a valid GUID, skip API and leave schedule empty until user selects a doctor
        if (!this.isValidGuid(doctorId)) {
            this.isLoading = false;
            return;
        }

        // If there is no backend yet, simulate availability for demo UI
        // Attempt an API call; on error, fallback to mock
        // İstek çakışmalarını önlemek için önceki aboneliği iptal et
        if (this.availabilitySub) {
            this.availabilitySub.unsubscribe();
        }

        // HttpService endpoint'e baseUrl eklediği için öne "/api" koyma
        this.availabilitySub = this.http.get<any>(
            'appointments/availability',
            { doctorId: doctorId, weekStart: startIso }
        ).subscribe({
            next: (result) => {
                const value = (result && result.value) ? result.value : result;
                if (!value || !Array.isArray(value)) {
                    this.applyMockAvailability();
                } else {
                    this.applyAvailabilityFromApi(value);
                }
                this.isLoading = false;
            },
            error: () => {
                this.applyMockAvailability();
                this.isLoading = false;
            }
        });
    }

    private formatLocalDate(d: Date): string {
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    onDoctorChange(): void {
        // show schedule only when both selected and doctorId is valid
        if (this.selectedDoctorId && this.selectedDepartment && this.isValidGuid(this.selectedDoctorId)) {
            this.loadAvailability();
        }
    }

    onDepartmentChange(): void {
        this.applyDoctorFilter();
        if (this.selectedDoctorId && this.selectedDepartment && this.isValidGuid(this.selectedDoctorId)) {
            this.loadAvailability();
        }
    }

    private computeDepartments(): void {
        const set = new Set<string>();
        for (const d of this.doctors) {
            if (d.department && d.department.trim()) set.add(d.department.trim());
        }
        this.departments = Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    private applyDoctorFilter(): void {
        if (this.selectedDepartment) {
            this.filteredDoctors = this.doctors.filter(d => (d.department || '').toLowerCase() === this.selectedDepartment!.toLowerCase());
            // Otomatik seçim yapma; mevcut seçim bu listede yoksa temizle
            if (!this.selectedDoctorId || !this.filteredDoctors.some(d => d.id === this.selectedDoctorId)) {
                this.selectedDoctorId = undefined;
            }
        } else {
            // Departman seçilmeden doktor listesi gösterilmesin
            this.filteredDoctors = [];
            this.selectedDoctorId = undefined;
        }
    }

    private applyAvailabilityFromApi(payload: any[]): void {
        // Expecting: [{ date: 'YYYY-MM-DD', slots: [{ time: '09:00', isBusy: true, title: '...' }, ...] }, ...]
        const map = new Map<string, DayAvailability>();
        for (const d of this.weekDays()) {
            map.set(d.date.toDateString(), { date: d.date, slots: d.slots.map(s => ({ ...s, isBusy: false, title: undefined })) });
        }
        for (const day of payload) {
            // Normalize API date (DateOnly serialized as "YYYY-MM-DD") to local Date without TZ shift
            let date: Date;
            if (typeof day.date === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(day.date)) {
                const [, y, m, d] = day.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)!;
                date = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
            } else if (day.date?.year && day.date?.month && day.date?.day) {
                // In case DateOnly serialized as object { year, month, day }
                date = new Date(day.date.year, day.date.month - 1, day.date.day, 0, 0, 0, 0);
            } else {
                date = new Date(day.date);
            }
            const key = date.toDateString();
            if (!map.has(key)) continue;
            const target = map.get(key)!;
            for (const slot of day.slots ?? []) {
                const timeStr = slot.time || slot.Time || '';
                const found = target.slots.find(s => s.time === timeStr);
                if (found) {
                    const busy = (slot.isBusy ?? slot.IsBusy) === true;
                    found.isBusy = busy;
                    found.title = slot.patientName ?? slot.PatientName ?? slot.title ?? slot.Title;
                    const rawId = slot.appointmentId ?? slot.AppointmentId;
                    found.appointmentId = rawId ? String(rawId) : undefined;
                    found.patientName = slot.patientName ?? slot.PatientName;
                    found.note = slot.note ?? slot.Note;
                }
            }
        }
        // Save to cache keyed by week start day and trigger recompute
        const start = this.weekStart();
        const key = new Date(start.getFullYear(), start.getMonth(), start.getDate()).toDateString();
        const cachedDays: DayAvailability[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            cachedDays.push(map.get(d.toDateString())!);
        }
        this.availabilityCache.set(key, cachedDays);
        // Trigger UI by setting weekStart to itself
        this.weekStart.set(new Date(start));
    }

    private applyMockAvailability(): void {
        // Simple deterministic mock: mark some slots busy for visual design
        const start = this.weekStart();
        const days = this.generateWeek(start);
        days.forEach((day, idx) => {
            day.slots.forEach((slot, si) => {
                const busy = ((idx + si) % 4 === 0); // pseudo pattern
                slot.isBusy = busy;
                slot.title = busy ? 'Booked' : undefined;
            });
        });
        // Trigger UI the same way
        const s = new Date(start);
        this.weekStart.set(s);
    }

    private isValidGuid(value: string): boolean {
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
    }

    // UI helpers
    isToday(date: Date): boolean {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        const c = new Date(date);
        c.setHours(0, 0, 0, 0);
        return c.getTime() === t.getTime();
    }

    // View switching
    setView(mode: 'day' | 'week' | 'month'): void {
        this.viewMode = mode;
        if (mode === 'week') {
            // Ensure selectedDay is within current week window
            const s = this.weekStart();
            const e = new Date(s); e.setDate(e.getDate() + 6);
            if (this.selectedDay < s || this.selectedDay > e) {
                this.selectedDay = new Date(s);
            }
            this.loadAvailability();
        } else if (mode === 'day') {
            // Align to this day’s week to show proper data
            this.weekStart.set(this.getStartOfWeek(this.selectedDay));
            this.loadAvailability();
        } else if (mode === 'month') {
            const current = this.weekStart();
            const firstOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
            this.weekStart.set(this.getStartOfWeek(firstOfMonth));
            this.loadAvailability();
        }
    }

    // Month view generation
    getMonthDays(): { date: Date; isCurrentMonth: boolean }[] {
        const start = this.weekStart();
        const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
        const firstGridDay = this.getStartOfWeek(monthStart);
        const days: { date: Date; isCurrentMonth: boolean }[] = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(firstGridDay);
            d.setDate(firstGridDay.getDate() + i);
            days.push({ date: d, isCurrentMonth: d.getMonth() === monthStart.getMonth() });
        }
        return days;
    }

    getBusyCountForDate(date: Date): number {
        // Approximate using current week data if within week; otherwise 0 for now
        const key = date.toDateString();
        const match = this.weekDays().find(d => d.date.toDateString() === key);
        if (!match) return 0;
        return match.slots.filter(s => s.isBusy).length;
    }

    // Navigation adapt to mode
    prev(): void {
        if (this.viewMode === 'day') {
            const d = new Date(this.selectedDay);
            d.setDate(d.getDate() - 1);
            this.selectedDay = d;
            // If moved before current week window, shift weekStart
            if (d < this.weekStart()) {
                const s = new Date(this.weekStart());
                s.setDate(s.getDate() - 7);
                this.weekStart.set(s);
                this.loadAvailability();
            }
        } else if (this.viewMode === 'week') {
            this.prevWeek();
        } else {
            const s = new Date(this.weekStart());
            s.setMonth(s.getMonth() - 1);
            this.weekStart.set(this.getStartOfWeek(new Date(s.getFullYear(), s.getMonth(), 1)));
            this.loadAvailability();
        }
    }

    next(): void {
        if (this.viewMode === 'day') {
            const d = new Date(this.selectedDay);
            d.setDate(d.getDate() + 1);
            this.selectedDay = d;
            const end = new Date(this.weekStart());
            end.setDate(end.getDate() + 6);
            if (d > end) {
                const s = new Date(this.weekStart());
                s.setDate(s.getDate() + 7);
                this.weekStart.set(s);
                this.loadAvailability();
            }
        } else if (this.viewMode === 'week') {
            this.nextWeek();
        } else {
            const s = new Date(this.weekStart());
            s.setMonth(s.getMonth() + 1);
            this.weekStart.set(this.getStartOfWeek(new Date(s.getFullYear(), s.getMonth(), 1)));
            this.loadAvailability();
        }
    }

    selectDayFromMonth(date: Date): void {
        this.selectedDay = new Date(date);
        // Shift week window to include this day and reload
        this.weekStart.set(this.getStartOfWeek(this.selectedDay));
        this.viewMode = 'day';
        this.loadAvailability();
    }

    // Stats helpers (for header cards)
    getWeekTotalSlots(): number {
        const days = this.weekDays();
        return days.length * this.timeSlots.length;
    }

    getWeekBusyCount(): number {
        const days = this.weekDays();
        let count = 0;
        for (const d of days) count += d.slots.filter(s => s.isBusy).length;
        return count;
    }

    getWeekFreeCount(): number {
        const total = this.getWeekTotalSlots();
        const busy = this.getWeekBusyCount();
        return Math.max(0, total - busy);
    }

    // Day view helpers
    private getSelectedDayIndex(): number {
        const d = this.selectedDay.getDay();
        return d === 0 ? 6 : d - 1; // Monday=0 ... Sunday=6
    }

    isSelectedDayBusy(rowIndex: number): boolean {
        const idx = this.getSelectedDayIndex();
        const day = this.weekDays()[idx];
        return !!day?.slots[rowIndex]?.isBusy;
    }

    isDayFullyBusy(day: DayAvailability): boolean {
        return Array.isArray(day?.slots) && day.slots.length > 0 && day.slots.every(s => !!s.isBusy);
    }

    // Booking modal state
    showBookingModal = false;
    bookingSubmitting = false;
    bookingError = '';
    bookingData: {
        day?: DayAvailability;
        slot?: DaySlot;
        fullName: string;
        identityNumber: string;
        phone: string;
        note: string;
    } = { fullName: '', identityNumber: '', phone: '', note: '' };

    // Booking modes: select existing patient or create new one
    bookingMode: 'select' | 'new' = 'select';
    patients: { id: string; fullName: string; identityNumber?: string; phone?: string }[] = [];
    patientsLoading = false;
    patientSearch = '';
    selectedPatientId: string | undefined;

    get filteredPatients(): { id: string; fullName: string; identityNumber?: string; phone?: string }[] {
        const q = (this.patientSearch || '').toLowerCase().trim();
        if (!q) return this.patients;
        return this.patients.filter(p =>
            p.fullName.toLowerCase().includes(q) ||
            (p.identityNumber || '').toLowerCase().includes(q) ||
            (p.phone || '').toLowerCase().includes(q)
        );
    }

    openBookingModal(day: DayAvailability, slot: DaySlot): void {
        this.bookingData = {
            day,
            slot,
            fullName: '',
            identityNumber: '',
            phone: '',
            note: ''
        };
        this.bookingError = '';
        this.showBookingModal = true;
        this.bookingMode = 'select';
        this.selectedPatientId = undefined;
        if (!this.patients.length) {
            this.loadPatients();
        }
    }

    closeBookingModal(): void {
        if (this.bookingSubmitting) return;
        this.showBookingModal = false;
    }

    async submitBooking(): Promise<void> {
        if (!this.selectedDoctorId) {
            this.bookingError = 'Lütfen önce bir doktor seçin';
            return;
        }
        const day = this.bookingData.day!;
        const slot = this.bookingData.slot!;
        this.bookingSubmitting = true;
        this.bookingError = '';
        try {
            // Determine patientId
            let patientId: string | undefined = undefined;
            if (this.bookingMode === 'select') {
                if (!this.selectedPatientId) {
                    this.bookingError = 'Lütfen bir hasta seçin';
                    this.bookingSubmitting = false;
                    return;
                }
                patientId = this.selectedPatientId;
            } else {
                // Validate new patient fields
                if (!this.bookingData.fullName?.trim()) {
                    this.bookingError = 'Ad Soyad zorunludur';
                    this.bookingSubmitting = false;
                    return;
                }
                if (!this.bookingData.identityNumber?.trim()) {
                    this.bookingError = 'TC Kimlik No zorunludur';
                    this.bookingSubmitting = false;
                    return;
                }
                // Split name into first/last
                const parts = this.bookingData.fullName.trim().split(/\s+/);
                const lastName = parts.pop() || '';
                const firstName = parts.join(' ') || lastName;
                const createPatientBody = {
                    firstName,
                    lastName,
                    identityNumber: this.bookingData.identityNumber,
                    birthDate: null,
                    gender: null,
                    phone: this.bookingData.phone || null
                } as any;
                const patientResp = await this.http.post<any>(API_ENDPOINTS.PATIENTS.CREATE, createPatientBody).toPromise();
                const patientVal = patientResp?.value ?? null;
                patientId = patientVal?.id;
                if (!patientId) throw new Error(patientResp?.error?.message || 'Hasta oluşturma başarısız');
                // Refresh patient list optionally
                this.loadPatients();
            }

            // Build appointment create body
            const start = new Date(day.date);
            const [hh, mm] = (slot.time || '00:00').split(':').map(n => parseInt(n, 10));
            start.setHours(hh, mm, 0, 0);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + 30);

            const createAppointmentBody = {
                doctorId: this.selectedDoctorId,
                patientId: patientId,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                note: this.bookingData.note || null
            };
            const apptResp = await this.http.post<any>(API_ENDPOINTS.APPOINTMENTS.CREATE, createAppointmentBody).toPromise();
            if (!apptResp?.isSuccess) {
                throw new Error(apptResp?.error?.message || 'Randevu oluşturma başarısız');
            }

            // Update UI
            slot.isBusy = true;
            slot.title = this.bookingMode === 'select'
                ? (this.patients.find(p => p.id === patientId)?.fullName || 'Booked')
                : (this.bookingData.fullName || 'Booked');
            this.showBookingModal = false;
            this.swal.toastSuccess('Randevu oluşturuldu');
            
            // Refresh availability to get appointmentId and other details
            this.loadAvailability();
        } catch (e: any) {
            const msg = e?.message || 'İşlem sırasında bir hata oluştu';
            // Overlap özel durumu: kullanıcıya bilgi ver, modalı kapat ve takvimi yenile
            if (msg.toLowerCase().includes('overlap')) {
                this.swal.toastError('Seçilen saat başka bir randevu ile çakışıyor');
                this.showBookingModal = false;
                this.loadAvailability();
            } else {
                this.bookingError = msg;
            }
        } finally {
            this.bookingSubmitting = false;
        }
    }

    // Check if slot is in the past
    isSlotInPast(day: DayAvailability, slot: DaySlot): boolean {
        if (!slot || !slot.time) return false;
        
        const now = new Date();
        const slotDate = new Date(day.date);
        const [hh, mm] = slot.time.split(':').map(Number);
        
        // Set slot date and time
        slotDate.setHours(hh, mm, 0, 0);
        
        // Get today's date at midnight for comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        
        // If slot date is before today, it's in the past
        if (slotDay < today) {
            return true;
        }
        
        // If slot date is today, check if the time has passed
        if (slotDay.getTime() === today.getTime()) {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const slotTime = hh * 60 + mm;
            // Allow booking only if slot time is at least 30 minutes in the future
            return slotTime <= currentTime;
        }
        
        return false;
    }

    // Check if slot is too far in the future (more than 15 days)
    isSlotTooFar(day: DayAvailability): boolean {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const slotDay = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
        
        // Calculate difference in days
        const diffTime = slotDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // If slot is more than 15 days in the future, it's too far
        return diffDays > 15;
    }

    // Shorten patient name for display in schedule
    shortenName(name: string, maxLength: number = 15): string {
        if (!name || name.length <= maxLength) return name;
        return name.substring(0, maxLength - 3) + '...';
    }

    // UI actions
    async onSlotClick(day: DayAvailability, slot: DaySlot, event?: MouseEvent, slotIndex?: number): Promise<void> {
        // Set flag to prevent document click handler from closing popover
        this.isClickingSlot = true;
        
        if (event) {
            event.stopPropagation(); // Prevent document click handler from closing popover immediately
        }
        
        if (!slot) {
            setTimeout(() => { this.isClickingSlot = false; }, 100);
            return;
        }
        
        // For busy slots, just toggle popover
        if (slot.isBusy) {
            // Use provided slotIndex or find it
            const index = slotIndex !== undefined ? slotIndex : day.slots.findIndex(s => s.time === slot.time && s.appointmentId === slot.appointmentId);
            this.toggleSlotPopover(day, slot, index);
            // Don't reset flag here - toggleSlotPopover will handle it
            return;
        }
        
        // For free slots, check restrictions
        // Check if slot is in the past first - prevent any interaction
        if (this.isSlotInPast(day, slot)) {
            this.swal.toastError('Geçmiş tarih ve saatler için randevu alınamaz');
            setTimeout(() => { this.isClickingSlot = false; }, 100);
            return;
        }
        
        // Check if slot is too far in the future (more than 15 days)
        if (this.isSlotTooFar(day)) {
            this.swal.toastError('Randevu almak için maksimum 15 gün ileriye kadar tarih seçebilirsiniz');
            setTimeout(() => { this.isClickingSlot = false; }, 100);
            return;
        }
        
        if (!this.selectedDoctorId) {
            this.swal.toastError('Lütfen önce bir doktor seçin');
            setTimeout(() => { this.isClickingSlot = false; }, 100);
            return;
        }
        
        setTimeout(() => { this.isClickingSlot = false; }, 100);
        this.openBookingModal(day, slot);
    }

    // Helper to check if this slot matches the popover slot
    isPopoverSlot(day: DayAvailability, slotIndex: number): boolean {
        if (!this.popoverVisible || !this.popoverSlot || !this.popoverDay) {
            return false;
        }
        
        const slot = day.slots[slotIndex];
        if (!slot) {
            return false;
        }
        
        // Compare by day, time, and appointmentId
        const dayMatch = this.popoverDay.date?.toDateString() === day.date?.toDateString();
        const timeMatch = this.popoverSlot.time === slot.time;
        const appointmentMatch = this.popoverSlot.appointmentId === slot.appointmentId;
        
        return dayMatch && timeMatch && appointmentMatch;
    }

    // Get popover position class based on slot index
    getPopoverPositionClass(): string {
        if (this.popoverSlotIndex === undefined) return '';
        // If slot index is 6 or higher (13:00 and later), show popover above
        // timeSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00']
        // Index 6 = 13:00, so from index 6 onwards, show popover above
        if (this.popoverSlotIndex >= 6) {
            return 'popover-bottom';
        }
        return 'popover-top';
    }

    toggleSlotPopover(day: DayAvailability, slot: DaySlot, slotIndex?: number): void {
        // Check if clicking the same slot that's already open
        const isSameSlot = this.popoverVisible &&
            this.popoverSlot?.appointmentId === slot.appointmentId &&
            this.popoverSlot?.time === slot.time &&
            this.popoverDay?.date?.toDateString() === day.date?.toDateString();
        
        if (isSameSlot) {
            // Same slot clicked, close popover
            this.popoverVisible = false;
            this.popoverSlot = undefined;
            this.popoverDay = undefined;
            this.popoverSlotIndex = undefined;
            this.cancelEditNote();
        } else {
            // Different slot or popover closed, open it
            // Set flag first to prevent document click handler from closing it
            this.isClickingSlot = true;
            // Set popover state immediately
            this.popoverVisible = true;
            this.popoverOpeningTime = Date.now(); // Record when popover is opened
            // IMPORTANT: Copy all properties including time and appointmentId
            this.popoverSlot = { 
                time: slot.time,
                isBusy: slot.isBusy,
                appointmentId: slot.appointmentId,
                patientName: slot.patientName,
                title: slot.title,
                note: slot.note
            };
            this.popoverDay = { ...day, date: new Date(day.date) }; // Deep copy of day
            this.popoverSlotIndex = slotIndex; // Store slot index for positioning
            this.cancelEditNote();
            // Force change detection immediately
            this.cdr.detectChanges();
            // Use setTimeout to reset flag after popover is rendered
            setTimeout(() => { 
                this.isClickingSlot = false;
            }, 300);
        }
    }

    startEditNote(slot: DaySlot): void {
        this.editingNote = true;
        this.noteText = slot.note || '';
        this.editingSlotId = slot.appointmentId;
    }

    cancelEditNote(): void {
        this.editingNote = false;
        this.noteText = '';
        this.editingSlotId = undefined;
    }

    saveNote(slot: DaySlot): void {
        const id = slot.appointmentId;
        if (!id) {
            this.swal.toastError('Randevu bilgisi bulunamadı');
            return;
        }

        // Get appointment details from popoverDay and slot
        if (!this.popoverDay) {
            this.swal.toastError('Randevu bilgisi bulunamadı');
            return;
        }

        // Parse date and time to create StartDate and EndDate
        const date = this.popoverDay.date;
        const [hh, mm] = slot.time.split(':').map(Number);
        const startDate = new Date(date);
        startDate.setHours(hh, mm, 0, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 30);

        // We need DoctorId and PatientId - we'll need to get them from the appointment
        // For now, let's get the appointment details first
        this.http.get<any>(API_ENDPOINTS.APPOINTMENTS.GET_BY_ID(id)).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.swal.toastError('Randevu bilgisi alınamadı');
                    return;
                }

                const appointment = (res as any).value || res;
                const updateData = {
                    doctorId: appointment.doctorId || appointment.doctor?.id,
                    patientId: appointment.patientId || appointment.patient?.id,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    isCompleted: appointment.isCompleted || false,
                    note: this.noteText.trim() || null
                };

                this.http.put<void>(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), updateData).subscribe({
                    next: (updateRes) => {
                        if (updateRes.isSuccess) {
                            this.swal.toastSuccess('Not güncellendi');
                            slot.note = this.noteText.trim() || undefined;
                            this.cancelEditNote();
                            this.loadAvailability();
                        } else {
                            const errorMsg = updateRes.error?.message || updateRes.error?.code || 'Güncelleme başarısız';
                            this.swal.toastError(errorMsg);
                        }
                    },
                    error: () => {
                        this.swal.toastError('Not güncellenirken bir hata oluştu');
                    }
                });
            },
            error: () => {
                this.swal.toastError('Randevu bilgisi alınamadı');
            }
        });
    }

    getEndTime(slot: DaySlot): string {
        if (!slot?.time) return '';
        const [hh, mm] = slot.time.split(':').map(Number);
        const endMinutes = mm + 30;
        const endHours = hh + Math.floor(endMinutes / 60);
        const finalMinutes = endMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
    }

    cancelAppointment(slot?: DaySlot): void {
        const targetSlot = slot || this.popoverSlot;
        const id = targetSlot?.appointmentId;
        
        if (!id) {
            this.swal.toastError('Randevu bilgisi bulunamadı');
            return;
        }
        
        const patientName = targetSlot?.patientName || targetSlot?.title || 'bu randevu';
        
        this.swal.confirm({
            titleText: 'Randevu İptali',
            html: `<strong>${patientName}</strong> adlı randevuyu iptal etmek istediğinize emin misiniz?`,
            icon: 'warning',
            confirmButtonText: 'Evet, İptal Et',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            focusCancel: true,
            reverseButtons: true
        }).then((confirmed) => {
            if (!confirmed) return;
            
            this.http.delete<void>(API_ENDPOINTS.APPOINTMENTS.DELETE(id)).subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.swal.toastSuccess('Randevu iptal edildi');
                        this.popoverVisible = false;
                        this.popoverSlot = undefined;
                        this.popoverDay = undefined;
                        this.loadAvailability();
                    } else {
                        const errorMsg = res.error?.message || res.error?.code || 'İptal başarısız';
                        this.swal.toastError(errorMsg);
                    }
                },
                error: () => {
                    this.swal.toastError('İptal sırasında bir hata oluştu');
                }
            });
        }).catch(() => {
            this.swal.toastError('Onay penceresi açılırken bir hata oluştu');
        });
    }

    private loadPatients(): void {
        this.patientsLoading = true;
        this.http.get<any[]>('patients').subscribe({
            next: (res) => {
                const val = (res as any).value ?? res;
                const list = Array.isArray(val) ? val : [];
                this.patients = list.map((p: any) => ({
                    id: p.id,
                    fullName: (p.firstName && p.lastName) ? `${p.firstName} ${p.lastName}` : (p.fullName || ''),
                    identityNumber: p.identityNumber,
                    phone: p.phone
                }));
                this.patientsLoading = false;
            },
            error: () => {
                this.patients = [];
                this.patientsLoading = false;
            }
        });
    }
}


