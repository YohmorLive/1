// ============================================
// Yohmor Live - Admin Panel
// ============================================

class AdminPanel {
    constructor() {
        this.data = this.loadData();
        this.currentEditingId = null;
        this.init();
    }

    // Load data
    loadData() {
        const stored = localStorage.getItem('yohmor_data');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading data:', e);
                return this.getDefaultData();
            }
        }
        return this.getDefaultData();
    }

    // Get default data
    getDefaultData() {
        return {
            site: {
                title: "Yohmor Live - يحمر لايف",
                description: "منصة الأعمال والخدمات في بلدة يحمر الشقيف",
                developer: "Mohammad Olleik",
                whatsapp: "+96171101381",
                instagram: "https://instagram.com/molleik7"
            },
            notifications: [],
            businesses: []
        };
    }

    // Save data
    saveData() {
        localStorage.setItem('yohmor_data', JSON.stringify(this.data));
        this.updateDataPreview();
    }

    // Initialize admin panel
    init() {
        this.setupTabNavigation();
        this.setupBusinessForm();
        this.setupNotificationForm();
        this.setupImportExport();
        this.setupSettings();
        this.renderBusinessesList();
        this.renderNotificationsList();
        this.loadSettings();
        this.updateDataPreview();
    }

    // ============================================
    // Tab Navigation
    // ============================================

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const tabId = `${tabName}-tab`;
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.classList.add('active');
        }

        // Add active to button
        const btn = document.querySelector(`[data-tab="${tabName}"]`);
        if (btn) {
            btn.classList.add('active');
        }
    }

    // ============================================
    // Business Management
    // ============================================

    setupBusinessForm() {
        const form = document.getElementById('businessForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBusinessForm();
            });

            form.addEventListener('reset', () => {
                this.currentEditingId = null;
            });
        }
    }

    saveBusinessForm() {
        const id = document.getElementById('businessId').value;
        const imageFile = document.getElementById('businessImage').files[0];
        
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const business = {
                    id: id || 'b' + Date.now(),
                    name: document.getElementById('businessName').value,
                    category: document.getElementById('businessCategory').value,
                    description: document.getElementById('businessDescription').value,
                    image: e.target.result,
                    whatsapp: document.getElementById('businessWhatsapp').value,
                    address: document.getElementById('businessAddress').value,
                    hours: document.getElementById('businessHours').value,
                    website: document.getElementById('businessWebsite').value,
                    tags: document.getElementById('businessTags').value.split(',').map(t => t.trim()).filter(t => t),
                    createdAt: id ? this.getBusinessCreatedAt(id) : new Date().toISOString()
                };
                this.saveBusiness(business, id);
            };
            reader.readAsDataURL(imageFile);
        } else {
            // If no file selected, use existing image or placeholder
            const business = {
                id: id || 'b' + Date.now(),
                name: document.getElementById('businessName').value,
                category: document.getElementById('businessCategory').value,
                description: document.getElementById('businessDescription').value,
                image: id ? this.getBusinessImage(id) : this.getPlaceholderImage(),
                whatsapp: document.getElementById('businessWhatsapp').value,
                address: document.getElementById('businessAddress').value,
                hours: document.getElementById('businessHours').value,
                website: document.getElementById('businessWebsite').value,
                tags: document.getElementById('businessTags').value.split(',').map(t => t.trim()).filter(t => t),
                createdAt: id ? this.getBusinessCreatedAt(id) : new Date().toISOString()
            };
            this.saveBusiness(business, id);
        }
    }

    saveBusiness(business, id) {

        if (id) {
            // Update existing
            const index = this.data.businesses.findIndex(b => b.id === id);
            if (index !== -1) {
                this.data.businesses[index] = business;
            }
        } else {
            // Add new
            this.data.businesses.push(business);
        }

        this.saveData();
        this.renderBusinessesList();
        document.getElementById('businessForm').reset();
        this.currentEditingId = null;
        this.showStatus('تم حفظ العمل بنجاح', 'success');
    }

    getBusinessCreatedAt(id) {
        const business = this.data.businesses.find(b => b.id === id);
        return business ? business.createdAt : new Date().toISOString();
    }

    editBusiness(id) {
        const business = this.data.businesses.find(b => b.id === id);
        if (!business) return;

        document.getElementById('businessId').value = business.id;
        document.getElementById('businessName').value = business.name;
        document.getElementById('businessCategory').value = business.category;
        document.getElementById('businessDescription').value = business.description;
        // Note: File input cannot be set programmatically for security reasons
        document.getElementById('businessImage').value = '';
        document.getElementById('businessWhatsapp').value = business.whatsapp;
        document.getElementById('businessAddress').value = business.address || '';
        document.getElementById('businessHours').value = business.hours || '';
        document.getElementById('businessWebsite').value = business.website || '';
        document.getElementById('businessTags').value = business.tags.join(', ');

        this.currentEditingId = id;
        this.switchTab('businesses');
        document.getElementById('businessName').focus();
    }

    deleteBusiness(id) {
        if (confirm('هل أنت متأكد من حذف هذا العمل؟')) {
            this.data.businesses = this.data.businesses.filter(b => b.id !== id);
            this.saveData();
            this.renderBusinessesList();
            this.showStatus('تم حذف العمل بنجاح', 'success');
        }
    }

    renderBusinessesList() {
        const list = document.getElementById('businessesList');
        if (!list) return;

        if (this.data.businesses.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #999;">لا توجد أعمال حالياً</p>';
            return;
        }

        list.innerHTML = this.data.businesses.map(business => `
            <div class="list-item">
                <div class="list-item-info">
                    <div class="list-item-title">${business.name}</div>
                    <div class="list-item-meta">
                        ${business.category} • ${business.whatsapp}
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="list-item-btn edit-btn" onclick="admin.editBusiness('${business.id}')">✏️ تعديل</button>
                    <button class="list-item-btn delete-btn" onclick="admin.deleteBusiness('${business.id}')">🗑️ حذف</button>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // Notification Management
    // ============================================

    setupNotificationForm() {
        const form = document.getElementById('notificationForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationForm();
            });

            form.addEventListener('reset', () => {
                this.currentEditingId = null;
            });
        }
    }

    saveNotificationForm() {
        const id = document.getElementById('notificationId').value;
        const notification = {
            id: id || 'n' + Date.now(),
            title: document.getElementById('notificationTitle').value,
            message: document.getElementById('notificationMessage').value,
            date: document.getElementById('notificationDate').value || new Date().toISOString(),
            pinned: document.getElementById('notificationPinned').checked
        };

        if (id) {
            // Update existing
            const index = this.data.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                this.data.notifications[index] = notification;
            }
        } else {
            // Add new
            this.data.notifications.push(notification);
        }

        this.saveData();
        this.renderNotificationsList();
        document.getElementById('notificationForm').reset();
        this.currentEditingId = null;
        this.showStatus('تم حفظ الإشعار بنجاح', 'success');
    }

    editNotification(id) {
        const notification = this.data.notifications.find(n => n.id === id);
        if (!notification) return;

        document.getElementById('notificationId').value = notification.id;
        document.getElementById('notificationTitle').value = notification.title;
        document.getElementById('notificationMessage').value = notification.message;
        document.getElementById('notificationDate').value = notification.date.slice(0, 16);
        document.getElementById('notificationPinned').checked = notification.pinned;

        this.currentEditingId = id;
        this.switchTab('notifications');
        document.getElementById('notificationTitle').focus();
    }

    deleteNotification(id) {
        if (confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
            this.data.notifications = this.data.notifications.filter(n => n.id !== id);
            this.saveData();
            this.renderNotificationsList();
            this.showStatus('تم حذف الإشعار بنجاح', 'success');
        }
    }

    renderNotificationsList() {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        if (this.data.notifications.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #999;">لا توجد إشعارات حالياً</p>';
            return;
        }

        list.innerHTML = this.data.notifications.map(notification => `
            <div class="list-item">
                <div class="list-item-info">
                    <div class="list-item-title">
                        ${notification.pinned ? '📌 ' : ''}${notification.title}
                    </div>
                    <div class="list-item-meta">
                        ${new Date(notification.date).toLocaleDateString('ar-SA')}
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="list-item-btn edit-btn" onclick="admin.editNotification('${notification.id}')">✏️ تعديل</button>
                    <button class="list-item-btn delete-btn" onclick="admin.deleteNotification('${notification.id}')">🗑️ حذف</button>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // Import/Export
    // ============================================

    setupImportExport() {
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');
        const importFile = document.getElementById('importFile');

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.handleImport(e.target.files[0]);
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.handleExport();
            });
        }
    }

    handleImport(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                // Validate structure
                if (!imported.site || !imported.notifications || !imported.businesses) {
                    throw new Error('صيغة الملف غير صحيحة');
                }

                this.data = imported;
                this.saveData();
                this.renderBusinessesList();
                this.renderNotificationsList();
                this.loadSettings();
                this.showStatus('تم استيراد البيانات بنجاح', 'success');
                document.getElementById('importFile').value = '';
            } catch (error) {
                this.showStatus('خطأ في استيراد الملف: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    handleExport() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yohmor-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showStatus('تم تصدير البيانات بنجاح', 'success');
    }

    // ============================================
    // Settings
    // ============================================

    setupSettings() {
        const form = document.getElementById('settingsForm');
        const clearBtn = document.getElementById('clearAllBtn');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('تحذير: هذا سيحذف جميع البيانات بشكل نهائي! هل أنت متأكد؟')) {
                    if (confirm('هل أنت متأكد تماماً؟')) {
                        this.data = this.getDefaultData();
                        this.saveData();
                        this.renderBusinessesList();
                        this.renderNotificationsList();
                        this.loadSettings();
                        this.showStatus('تم حذف جميع البيانات', 'success');
                    }
                }
            });
        }
    }

    loadSettings() {
        document.getElementById('siteTitle').value = this.data.site.title;
        document.getElementById('siteDescription').value = this.data.site.description;
        document.getElementById('developerName').value = this.data.site.developer;
        document.getElementById('developerWhatsapp').value = this.data.site.whatsapp;
        document.getElementById('developerInstagram').value = this.data.site.instagram;
    }

    saveSettings() {
        this.data.site.title = document.getElementById('siteTitle').value;
        this.data.site.description = document.getElementById('siteDescription').value;
        this.data.site.developer = document.getElementById('developerName').value;
        this.data.site.whatsapp = document.getElementById('developerWhatsapp').value;
        this.data.site.instagram = document.getElementById('developerInstagram').value;

        this.saveData();
        this.showStatus('تم حفظ الإعدادات بنجاح', 'success');
    }

    // ============================================
    // Utilities
    // ============================================

    updateDataPreview() {
        const preview = document.getElementById('dataPreview');
        if (preview) {
            preview.textContent = JSON.stringify(this.data, null, 2);
        }
    }

    getBusinessImage(id) {
        const business = this.data.businesses.find(b => b.id === id);
        return business ? business.image : this.getPlaceholderImage();
    }

    getPlaceholderImage() {
        const colors = ['1E9F5D', '0B8A4B', '1E7A3A'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23${color}' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3E📷%3C/text%3E%3C/svg%3E`;
    }

    showStatus(message, type) {
        // Show in import/export tab
        const importStatus = document.getElementById('importStatus');
        const exportStatus = document.getElementById('exportStatus');

        const statusDiv = importStatus || exportStatus;
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `status-message ${type}`;
            setTimeout(() => {
                statusDiv.className = 'status-message';
            }, 3000);
        }

        // Also show as alert
        if (type === 'error') {
            console.error(message);
        }
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});
