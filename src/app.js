// Initialize data storage
let users = JSON.parse(localStorage.getItem('laundryUsers')) || [
    { email: 'admin@taylor.edu', password: 'admin123', role: 'admin', name: 'Admin User', studentId: 'ADMIN001' }
];

let bookings = JSON.parse(localStorage.getItem('laundryBookings')) || [];
let currentUser = null;
let selectedBooking = null;

const machines = ['Washer 1', 'Washer 2', 'Washer 3', 'Dryer 1', 'Dryer 2'];
const timeSlots = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00'
];

// Save data to localStorage
function saveData() {
    localStorage.setItem('laundryUsers', JSON.stringify(users));
    localStorage.setItem('laundryBookings', JSON.stringify(bookings));
    console.log('Data saved. Total bookings:', bookings.length);
}

// Show/Hide forms
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
}

function showSignup() {
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
}

// Login
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => (u.email === email || u.studentId === email) && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials!');
    }
}

// Signup
function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const studentId = document.getElementById('signupStudentId').value;
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !studentId || !password) {
        alert('Please fill in all fields!');
        return;
    }

    if (users.find(u => u.email === email || u.studentId === studentId)) {
        alert('User already exists!');
        return;
    }

    users.push({
        name,
        email,
        studentId,
        password,
        role: 'user'
    });

    saveData();
    alert('Account created successfully! Please login.');
    showLogin();
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Check if user is logged in on dashboard page
function checkAuth() {
    if (window.location.pathname.includes('dashboard.html')) {
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = JSON.parse(savedUser);
        if (currentUser.role === 'admin') {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
}

// Show User Dashboard
function showUserDashboard() {
    document.getElementById('userDashboard').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userStudentId').textContent = currentUser.studentId;
    renderSchedule();
    renderMyBookings();
}

// Show Admin Dashboard
function showAdminDashboard() {
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('userDashboard').style.display = 'none';
    renderAdminBookings();
}

// Tab switching
function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'schedule') {
        document.getElementById('scheduleTab').classList.remove('hidden');
        document.getElementById('mybookingsTab').classList.add('hidden');
        renderSchedule();
    } else {
        document.getElementById('scheduleTab').classList.add('hidden');
        document.getElementById('mybookingsTab').classList.remove('hidden');
        renderMyBookings();
    }
}

// Get today's date
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Render schedule
function renderSchedule() {
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const today = getTodayDate();

    machines.forEach(machine => {
        const card = document.createElement('div');
        card.className = 'machine-card';
        card.innerHTML = `<h3>${machine}</h3>`;

        timeSlots.forEach(time => {
            const booking = bookings.find(b => 
                b.machine === machine && 
                b.time === time && 
                b.date === today
            );

            const slot = document.createElement('div');
            slot.className = 'time-slot';

            if (booking) {
                if (booking.userId === currentUser.studentId) {
                    slot.className += ' my-booking';
                    slot.innerHTML = `<span>${time}</span><span>Your Booking</span>`;
                } else {
                    slot.className += ' booked';
                    slot.innerHTML = `<span>${time}</span><span>Booked</span>`;
                }
            } else {
                slot.className += ' available';
                slot.innerHTML = `<span>${time}</span><span>Available</span>`;
                slot.onclick = () => openBookingModal(machine, today, time);
            }

            card.appendChild(slot);
        });

        grid.appendChild(card);
    });
}

// Open booking modal
let pendingBooking = null;

function openBookingModal(machine, date, time) {
    pendingBooking = { machine, date, time };
    document.getElementById('modalMachine').textContent = machine;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalTime').textContent = time;
    document.getElementById('bookingModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    pendingBooking = null;
}

// Confirm booking
function confirmBooking() {
    if (!pendingBooking) return;

    const booking = {
        id: Date.now().toString(),
        userId: currentUser.studentId,
        userName: currentUser.name,
        machine: pendingBooking.machine,
        date: pendingBooking.date,
        time: pendingBooking.time,
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveData();
    
    console.log('Booking created:', booking);
    console.log('All bookings:', bookings);
    
    closeModal();
    renderSchedule();
    renderMyBookings();
    alert('Booking confirmed! Your Student ID is: ' + currentUser.studentId);
}

// Render my bookings
function renderMyBookings() {
    const container = document.getElementById('myBookingsList');
    if (!container) return;
    
    const myBookings = bookings.filter(b => b.userId === currentUser.studentId);

    console.log('Rendering my bookings. Total:', myBookings.length);
    console.log('Current user ID:', currentUser.studentId);
    console.log('My bookings:', myBookings);

    if (myBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📅 No Bookings Yet</h3>
                <p>Book a time slot from the "Available Machines" tab to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = myBookings.map(booking => `
        <div class="booking-card">
            <h3>🧺 ${booking.machine}</h3>
            <p><strong>📅 Date:</strong> ${booking.date}</p>
            <p><strong>⏰ Time:</strong> ${booking.time}</p>
            <p><strong>🆔 Your ID:</strong> ${booking.userId}</p>
            <div class="booking-actions">
                <button class="btn btn-success" onclick="openRescheduleModal('${booking.id}')">Reschedule</button>
                <button class="btn btn-danger" onclick="cancelBooking('${booking.id}')">Cancel</button>
            </div>
        </div>
    `).join('');
}

// Cancel booking
function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        bookings = bookings.filter(b => b.id !== bookingId);
        saveData();
        renderSchedule();
        renderMyBookings();
        alert('Booking cancelled successfully!');
    }
}

// Open reschedule modal
function openRescheduleModal(bookingId) {
    selectedBooking = bookings.find(b => b.id === bookingId);
    
    // Populate machines
    const machineSelect = document.getElementById('rescheduleMachine');
    machineSelect.innerHTML = machines.map(m => 
        `<option value="${m}" ${m === selectedBooking.machine ? 'selected' : ''}>${m}</option>`
    ).join('');

    // Set date
    document.getElementById('rescheduleDate').value = getTodayDate();
    document.getElementById('rescheduleDate').min = getTodayDate();

    // Populate times
    updateRescheduleTimeSlots();

    document.getElementById('rescheduleModal').style.display = 'flex';
}

function closeRescheduleModal() {
    document.getElementById('rescheduleModal').style.display = 'none';
    selectedBooking = null;
}

function updateRescheduleTimeSlots() {
    const machine = document.getElementById('rescheduleMachine').value;
    const date = document.getElementById('rescheduleDate').value;
    const timeSelect = document.getElementById('rescheduleTime');

    const availableSlots = timeSlots.filter(time => {
        return !bookings.some(b => 
            b.machine === machine && 
            b.time === time && 
            b.date === date &&
            b.id !== selectedBooking.id
        );
    });

    timeSelect.innerHTML = availableSlots.map(time => 
        `<option value="${time}">${time}</option>`
    ).join('');
}

// Event listeners for reschedule modal
document.addEventListener('DOMContentLoaded', function() {
    const rescheduleMachine = document.getElementById('rescheduleMachine');
    const rescheduleDate = document.getElementById('rescheduleDate');
    
    if (rescheduleMachine) {
        rescheduleMachine.addEventListener('change', updateRescheduleTimeSlots);
    }
    if (rescheduleDate) {
        rescheduleDate.addEventListener('change', updateRescheduleTimeSlots);
    }
    
    // Check authentication on page load
    checkAuth();
});

// Confirm reschedule
function confirmReschedule() {
    const machine = document.getElementById('rescheduleMachine').value;
    const date = document.getElementById('rescheduleDate').value;
    const time = document.getElementById('rescheduleTime').value;

    const booking = bookings.find(b => b.id === selectedBooking.id);
    booking.machine = machine;
    booking.date = date;
    booking.time = time;

    saveData();
    closeRescheduleModal();
    renderSchedule();
    renderMyBookings();
    alert('Booking rescheduled successfully!');
}

// Render admin bookings
function renderAdminBookings() {
    const tbody = document.getElementById('adminBookingsTable');
    if (!tbody) return;
    
    console.log('Rendering admin bookings. Total:', bookings.length);
    console.log('All bookings:', bookings);
    
    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <h3>📋 No Bookings Yet</h3>
                        <p>Bookings will appear here once students make reservations</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Sort bookings by date and time
    const sortedBookings = [...bookings].sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return a.time.localeCompare(b.time);
    });

    tbody.innerHTML = sortedBookings.map(booking => {
        const status = 'Active';
        const statusClass = 'status-active';

        return `
            <tr>
                <td>${booking.userName}</td>
                <td>${booking.userId}</td>
                <td>${booking.machine}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-danger" style="padding: 6px 12px; font-size: 14px; width: auto;" onclick="adminCancelBooking('${booking.id}')">Cancel</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Admin cancel booking
function adminCancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        bookings = bookings.filter(b => b.id !== bookingId);
        saveData();
        renderAdminBookings();
        alert('Booking cancelled successfully!');
    }
}

// Auto-refresh every 30 seconds
setInterval(() => {
    if (currentUser) {
        if (currentUser.role === 'admin') {
            renderAdminBookings();
        } else {
            renderSchedule();
            renderMyBookings();
        }
    }
}, 30000);

// Initialize - load saved bookings
console.log('Initialized. Total bookings:', bookings.length);