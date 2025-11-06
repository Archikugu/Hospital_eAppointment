import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models/user.model';
import { UserDisplayNamePipe } from '../../core/pipes/user-display-name.pipe';
import { ALL_DEPARTMENTS } from '../../models/doctor.model';
import { UserRoleService } from '../../core/services/user-role.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, UserDisplayNamePipe],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              <span class="title-icon"><i class="fas fa-id-badge"></i></span>
              Users Management
            </h1>
            <p class="page-subtitle">Manage and monitor all system users</p>
          </div>
          <button class="btn-add-user" type="button" (click)="openAddUserModal()">
            <i class="fas fa-user-plus"></i>
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <div class="container-fluid px-4">
        <div class="search-filter-section">
          <div class="search-filter-card">
            <div class="search-wrapper">
              <div class="search-icon"><i class="fas fa-search"></i></div>
              <input class="search-input" type="text" placeholder="Search by name, username or email" [value]="searchTerm()" (input)="onSearchInput(($any($event.target)).value)" />
              <button class="clear-search" *ngIf="searchTerm()" (click)="searchTerm.set('')"><i class="fas fa-times"></i></button>
            </div>
          </div>
        </div>

        <div class="stats-grid" *ngIf="!isLoading() && !errorMessage()">
          <div class="stat-card stat-card-primary">
            <div class="stat-content">
              <div class="stat-info">
                <p class="stat-label">Total Users</p>
                <h2 class="stat-value">{{ totalUsers() }}</h2>
              </div>
              <div class="stat-icon stat-icon-primary"><i class="fas fa-users"></i></div>
            </div>
            <div class="stat-wave"></div>
          </div>
          <div class="stat-card stat-card-success">
            <div class="stat-content">
              <div class="stat-info">
                <p class="stat-label">Admins</p>
                <h2 class="stat-value">{{ totalAdmins() }}</h2>
              </div>
              <div class="stat-icon stat-icon-success"><i class="fas fa-user-shield"></i></div>
            </div>
            <div class="stat-wave"></div>
          </div>
          <div class="stat-card stat-card-info">
            <div class="stat-content">
              <div class="stat-info">
                <p class="stat-label">Distinct Roles</p>
                <h2 class="stat-value">{{ distinctRoles().length }}</h2>
              </div>
              <div class="stat-icon stat-icon-info"><i class="fas fa-tags"></i></div>
            </div>
            <div class="stat-wave"></div>
          </div>
        </div>

        <div class="users-grid" *ngIf="!isLoading() && !errorMessage() && filteredUsers().length; else empty">
          <div class="user-card" *ngFor="let u of filteredUsers()">
            <div class="user-card-header">
              <div class="user-avatar">{{ (u | userDisplayName:2) }}</div>
              <div class="user-status"><span class="status-dot"></span><span class="status-text">{{ u.isActive ? 'Active' : 'Inactive' }}</span></div>
            </div>
            <div class="user-card-body">
              <h3 class="user-name">{{ u | userDisplayName }}</h3>
              <div class="user-username"><i class="fas fa-user"></i><span>{{ u.username }}</span></div>
              <div class="user-email" *ngIf="u.email"><i class="fas fa-envelope"></i><span>{{ u.email }}</span></div>
              <div class="user-roles">
                <span class="role-pill" *ngFor="let r of u.roles">{{ r }}</span>
              </div>
            </div>
            <div class="user-card-footer">
              <button class="action-btn view-btn" type="button" (click)="openViewUserModal(u)"><i class="fas fa-eye"></i></button>
              <button class="action-btn edit-btn" type="button" (click)="openEditUserModal(u)"><i class="fas fa-edit"></i></button>
              <button class="action-btn delete-btn" type="button" (click)="deleteUser(u)"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>

        <div class="loading-state" *ngIf="isLoading()">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p>Loading users...</p>
        </div>

        <div *ngIf="!isLoading() && errorMessage()" class="alert alert-danger mt-3" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>
          {{ errorMessage() }}
          <button class="btn btn-sm btn-outline-danger ms-2" (click)="loadUsers()">
            <i class="fas fa-redo me-1"></i>Retry
          </button>
        </div>

        <ng-template #empty>
          <div class="empty-state">
            <div class="empty-state-content">
              <div class="empty-icon"><i class="fas fa-id-badge"></i></div>
              <h3>No Users Found</h3>
              <p>{{ searchTerm() ? 'Try clearing your search' : 'Get started by adding a new user' }}</p>
              <div class="empty-actions">
                <button class="btn-primary-modern" type="button" *ngIf="!searchTerm()"><i class="fas fa-user-plus"></i><span>Add Your First User</span></button>
                <button class="btn-secondary-modern" type="button" *ngIf="searchTerm()" (click)="searchTerm.set('')"><i class="fas fa-times"></i><span>Clear Search</span></button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Add User Modal -->
      <div class="modal-backdrop" *ngIf="isAddModalOpen()" (click)="closeAddUserModal()"></div>
      <div class="modal-wrapper" *ngIf="isAddModalOpen()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fas fa-user-plus me-2"></i>Yeni Kullanıcı</h3>
            <button type="button" class="btn-close" (click)="closeAddUserModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-user me-1"></i>Username</label>
              <input class="form-control" type="text" [ngModel]="addModel().username" (ngModelChange)="onAddChange('username', $event)" placeholder="kullaniciadi" required minlength="3" />
              <small class="text-danger" *ngIf="(addModel().username||'').trim().length>0 && (addModel().username||'').trim().length<3">Kullanıcı adı en az 3 karakter olmalıdır.</small>
            </div>
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-envelope me-1"></i>Email</label>
              <input class="form-control" type="email" [ngModel]="addModel().email" (ngModelChange)="onAddChange('email', $event)" placeholder="email@example.com" />
              <small class="text-danger" *ngIf="(addModel().email||'').trim().length>0 && !isValidEmail(addModel().email)">Geçerli bir e-posta adresi giriniz.</small>
            </div>
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-lock me-1"></i>Password</label>
              <input class="form-control" type="password" [ngModel]="addModel().password" (ngModelChange)="onAddChange('password', $event)" placeholder="••••••••" required minlength="6" />
              <small class="text-danger" *ngIf="(addModel().password||'').length>0 && (addModel().password||'').length<6">Şifre en az 6 karakter olmalıdır.</small>
            </div>
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-id-card me-1"></i>First Name</label>
              <input class="form-control" type="text" [ngModel]="addModel().firstName" (ngModelChange)="onAddChange('firstName', $event)" />
              <small class="text-danger" *ngIf="(addModel().firstName||'').trim().length>0 && (addModel().firstName||'').trim().length<2">Ad en az 2 karakter olmalıdır.</small>
            </div>
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-id-card me-1"></i>Last Name</label>
              <input class="form-control" type="text" [ngModel]="addModel().lastName" (ngModelChange)="onAddChange('lastName', $event)" />
              <small class="text-danger" *ngIf="(addModel().lastName||'').trim().length>0 && (addModel().lastName||'').trim().length<2">Soyad en az 2 karakter olmalıdır.</small>
            </div>
            <div class="mb-2"><strong>Roller</strong></div>
            <div class="roles-grid">
              <label class="role-option" *ngFor="let r of allRoles()">
                <input type="checkbox" [checked]="addSelectedRoles().includes(r)" (change)="onAddRoleCheckboxChange(r, ($any($event.target)).checked)" />
                <span class="label-text">{{ r }}</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeAddUserModal()"><i class="fas fa-times me-1"></i>Vazgeç</button>
            <button type="button" class="btn btn-primary" (click)="createUser()" [disabled]="!isAddFormValid() || isLoading()"><i class="fas fa-save me-1"></i>Oluştur</button>
          </div>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div class="modal-backdrop" *ngIf="isEditModalOpen()" (click)="closeEditUserModal()"></div>
      <div class="modal-wrapper" *ngIf="isEditModalOpen()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fas fa-user-edit me-2"></i>Kullanıcıyı Düzenle</h3>
            <button type="button" class="btn-close" (click)="closeEditUserModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-envelope me-1"></i>Email</label>
              <input class="form-control" type="email" [ngModel]="editModel().email" (ngModelChange)="onEditChange('email', $event)" />
            </div>
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-id-card me-1"></i>First Name</label>
              <input class="form-control" type="text" [ngModel]="editModel().firstName" (ngModelChange)="onEditChange('firstName', $event)" />
            </div>
            <div class="mb-3">
              <label class="form-label"><i class="fas fa-id-card me-1"></i>Last Name</label>
              <input class="form-control" type="text" [ngModel]="editModel().lastName" (ngModelChange)="onEditChange('lastName', $event)" />
            </div>
            <div class="mb-2"><strong>Roller</strong></div>
            <div class="roles-grid">
              <label class="role-option" *ngFor="let r of allRoles()">
                <input type="checkbox" [checked]="editSelectedRoles().includes(r)" (change)="onEditRoleCheckboxChange(r, ($any($event.target)).checked)" />
                <span class="label-text">{{ r }}</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeEditUserModal()"><i class="fas fa-times me-1"></i>Vazgeç</button>
            <button type="button" class="btn btn-primary" (click)="updateUser()" [disabled]="!isEditFormValid() || isLoading()"><i class="fas fa-save me-1"></i>Güncelle</button>
          </div>
        </div>
      </div>

      <!-- Roles Modal -->
      <div class="modal-backdrop" *ngIf="isRolesModalOpen()" (click)="closeRolesModal()"></div>
      <div class="modal-wrapper" *ngIf="isRolesModalOpen()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fas fa-user-shield me-2"></i>Rolleri Düzenle
            </h3>
            <button type="button" class="btn-close" (click)="closeRolesModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <p class="mb-3"><strong>Kullanıcı:</strong> {{ selectedUserName() }}</p>

            <div class="roles-grid">
              <label class="role-option" *ngFor="let r of allRoles()">
                <input type="checkbox" [checked]="isRoleSelected(r)" (change)="onRoleCheckboxChange(r, ($any($event.target)).checked)" />
                <span class="label-text">{{ r }}</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeRolesModal()">
              <i class="fas fa-times me-1"></i>Vazgeç
            </button>
            <button type="button" class="btn btn-primary" (click)="saveUserRoles()">
              <i class="fas fa-save me-1"></i>Kaydet
            </button>
          </div>
        </div>
      </div>

      <!-- Promote Doctor Modal -->
      <div class="modal-backdrop" *ngIf="isPromoteDoctorOpen()" (click)="closePromoteDoctorModal()"></div>
      <div class="modal-wrapper" *ngIf="isPromoteDoctorOpen()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fas fa-user-md me-2"></i>Doktor Bilgileri</h3>
            <button type="button" class="btn-close" (click)="closePromoteDoctorModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Ad</label>
                  <input class="form-control" type="text" [ngModel]="promoteDoctorModel().firstName" (ngModelChange)="onPromoteDoctorChange('firstName', $event)" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Soyad</label>
                  <input class="form-control" type="text" [ngModel]="promoteDoctorModel().lastName" (ngModelChange)="onPromoteDoctorChange('lastName', $event)" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Department</label>
                  <select class="form-select" [ngModel]="promoteDoctorModel().departmentValue" (ngModelChange)="onPromoteDoctorDeptChange($event)">
                <option [ngValue]="0">Select department</option>
                <option *ngFor="let d of departments()" [ngValue]="d.value">{{ d.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closePromoteDoctorModal()"><i class="fas fa-times me-1"></i>Vazgeç</button>
                <button type="button" class="btn btn-primary" (click)="submitPromoteDoctor()" [disabled]="!isPromoteDoctorValid() || isLoading()"><i class="fas fa-save me-1"></i>Kaydet</button>
          </div>
        </div>
      </div>

      <!-- Promote Patient Modal -->
      <div class="modal-backdrop" *ngIf="isPromotePatientOpen()" (click)="closePromotePatientModal()"></div>
      <div class="modal-wrapper" *ngIf="isPromotePatientOpen()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fas fa-user-injured me-2"></i>Hasta Bilgileri</h3>
            <button type="button" class="btn-close" (click)="closePromotePatientModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Ad</label>
                  <input class="form-control" type="text" [ngModel]="promotePatientModel().firstName" (ngModelChange)="onPromotePatientChange('firstName', $event)" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Soyad</label>
                  <input class="form-control" type="text" [ngModel]="promotePatientModel().lastName" (ngModelChange)="onPromotePatientChange('lastName', $event)" required />
            </div>
            <div class="mb-3">
              <label class="form-label">T.C. Kimlik No</label>
                  <input class="form-control" type="text" [ngModel]="promotePatientModel().identityNumber" (ngModelChange)="onPromotePatientChange('identityNumber', $event)" maxlength="11" inputmode="numeric" pattern="\\d{11}" placeholder="11 haneli" required />
              <small class="text-muted">11 haneli numerik olmalıdır.</small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closePromotePatientModal()"><i class="fas fa-times me-1"></i>Vazgeç</button>
                <button type="button" class="btn btn-primary" (click)="submitPromotePatient()" [disabled]="!isPromotePatientValid() || isLoading()"><i class="fas fa-save me-1"></i>Kaydet</button>
          </div>
        </div>
      </div>

      <!-- View User Modal -->
      <div class="modal-backdrop" *ngIf="isViewModalOpen()" (click)="closeViewUserModal()"></div>
      <div class="modal-wrapper" *ngIf="isViewModalOpen()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="view-modal">
            <div class="view-header">
              <div class="view-header-left">
                <div class="view-avatar">{{ (viewUser() | userDisplayName:2) }}</div>
                <div class="view-title">
                  <h3>{{ viewUser() | userDisplayName }}</h3>
                  <p><span class="at">&#64;</span>{{ viewUser()?.username }}</p>
                </div>
              </div>
              <div class="view-status" [class.active]="viewUser()?.isActive" [class.inactive]="!viewUser()?.isActive">
                <span class="dot"></span>{{ viewUser()?.isActive ? 'Aktif' : 'Pasif' }}
              </div>
            </div>

            <div class="view-body">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label"><i class="fas fa-id-card"></i> Ad Soyad</div>
                  <div class="info-value">{{ (viewUser() | userDisplayName) || '-' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label"><i class="fas fa-user"></i> Kullanıcı Adı</div>
                  <div class="info-value">{{ viewUser()?.username }}</div>
                </div>
                <div class="info-item" *ngIf="viewUser()?.email">
                  <div class="info-label"><i class="fas fa-envelope"></i> Email</div>
                  <div class="info-value">{{ viewUser()?.email }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label"><i class="fas fa-user-shield"></i> Roller</div>
                  <div class="info-value roles">
                    <span class="chip" *ngFor="let r of (viewUser()?.roles || [])">{{ r }}</span>
                  </div>
                </div>
              </div>

              <div class="badges">
                <div class="badge" *ngIf="(viewUser()?.roles || []).includes('Doctor')">
                  <i class="fas fa-user-md"></i>
                  <span>Doktor rolü atanmış</span>
                </div>
                <div class="badge" *ngIf="(viewUser()?.roles || []).includes('Patient')">
                  <i class="fas fa-user-injured"></i>
                  <span>Hasta rolü atanmış</span>
                </div>
              </div>
            </div>

            <div class="view-footer">
              <button type="button" class="btn btn-roles-modern" (click)="onViewRolesClick()"><i class="fas fa-user-shield me-1"></i>Rolleri Yönet</button>
              <button type="button" class="btn btn-primary-modern" (click)="onViewEditClick()"><i class="fas fa-edit me-1"></i>Düzenle</button>
              <button type="button" class="btn btn-danger-modern" (click)="closeViewUserModal()"><i class="fas fa-times me-1"></i>Kapat</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.users-page{min-height:100vh;background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);padding-bottom:2rem;}`,
    `.page-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:3rem 2rem;margin-bottom:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.1);}`,
    `.header-content{max-width:1400px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:2rem;}`,
    `.header-text{color:#fff;}`,
    `.page-title{font-size:2.5rem;font-weight:700;margin:0 0 .5rem 0;display:flex;align-items:center;gap:1rem;}`,
    `.title-icon{width:60px;height:60px;background:rgba(255,255,255,.2);border-radius:15px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);font-size:1.5rem;}`,
    `.page-subtitle{font-size:1.1rem;opacity:.9;margin:0;}`,
    `.btn-add-user{background:#fff;color:#667eea;border:none;padding:.875rem 2rem;border-radius:12px;font-weight:600;font-size:1rem;cursor:pointer;display:flex;align-items:center;gap:.5rem;transition:all .3s ease;box-shadow:0 4px 15px rgba(0,0,0,.2);}`,
    `.btn-add-user:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.3);}`,
    `.search-filter-section{margin-bottom:2rem;}`,
    `.search-filter-card{background:#fff;border-radius:20px;padding:1.5rem;box-shadow:0 10px 40px rgba(0,0,0,.08);display:flex;gap:1rem;align-items:center;flex-wrap:wrap;}`,
    `.search-wrapper{flex:1;min-width:300px;position:relative;display:flex;align-items:center;}`,
    `.search-icon{position:absolute;left:1rem;color:#667eea;z-index:1;}`,
    `.search-input{width:100%;padding:.875rem 1rem .875rem 3rem;border:2px solid #e9ecef;border-radius:12px;font-size:1rem;transition:all .3s ease;}`,
    `.search-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102,126,234,.1);}`,
    `.clear-search{position:absolute;right:1rem;background:none;border:none;color:#6c757d;cursor:pointer;padding:.25rem;display:flex;align-items:center;}`,
    `.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-bottom:2rem;}`,
    `.stat-card{background:#fff;border-radius:20px;padding:2rem;position:relative;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);transition:transform .3s ease,box-shadow .3s ease;}`,
    `.stat-card:hover{transform:translateY(-5px);box-shadow:0 15px 50px rgba(0,0,0,.12);}`,
    `.stat-content{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;}`,
    `.stat-label{font-size:.875rem;color:#6c757d;margin:0 0 .5rem 0;font-weight:500;}`,
    `.stat-value{font-size:2.5rem;font-weight:700;margin:0;color:#212529;}`,
    `.stat-icon{width:70px;height:70px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:2rem;opacity:.2;}`,
    `.stat-icon-primary{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#667eea;}`,
    `.stat-icon-success{background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);color:#11998e;}`,
    `.stat-icon-info{background:linear-gradient(135deg,#2193b0 0%,#6dd5ed 100%);color:#2193b0;}`,
    `.stat-wave{position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,rgba(102,126,234,.5),transparent);animation:wave 3s ease-in-out infinite;}`,
    `@keyframes wave{0%,100%{transform:translateX(-100%)}50%{transform:translateX(100%)}}`,
    `.users-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem;}`,
    `.user-card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);transition:all .3s ease;border:1px solid #f0f0f0;}`,
    `.user-card:hover{transform:translateY(-8px);box-shadow:0 20px 60px rgba(0,0,0,.15);}`,
    `.user-card-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:2rem;display:flex;justify-content:space-between;align-items:center;}`,
    `.user-avatar{width:90px;height:90px;border-radius:20px;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:2rem;border:3px solid rgba(255,255,255,.3);box-shadow:0 8px 20px rgba(0,0,0,.2);}`,
    `.user-status{display:flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:.5rem 1rem;border-radius:20px;color:#fff;font-size:.875rem;font-weight:500;}`,
    `.status-dot{width:8px;height:8px;background:#38ef7d;border-radius:50%;animation:pulse 2s ease-in-out infinite;}`,
    `@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`,
    `.user-card-body{padding:2rem;}`,
    `.user-name{font-size:1.5rem;font-weight:700;color:#212529;margin:0 0 1rem 0;}`,
    `.user-username,.user-email{display:flex;align-items:center;gap:.5rem;color:#667eea;font-weight:600;margin-bottom:1rem;font-size:1rem;}`,
    `.user-email{color:#6c757d;font-weight:500;}`,
    `.user-email i{color:#667eea;}`,
    `.user-roles{display:flex;flex-wrap:wrap;gap:.5rem;padding-top:1rem;border-top:1px solid #f0f0f0;}`,
    `.role-pill{background:#eef2ff;color:#3b5bdb;border:1px solid #dbe4ff;padding:2px 8px;border-radius:999px;font-size:12px;}`,
    `.user-card-footer{padding:1rem 2rem;background:#f8f9fa;display:flex;gap:.5rem;border-top:1px solid #f0f0f0;}`,
    `.action-btn{flex:1;padding:.75rem;border:none;border-radius:10px;cursor:pointer;font-size:1rem;transition:all .3s ease;display:flex;align-items:center;justify-content:center;}`,
    `.view-btn{background:#e3f2fd;color:#1976d2;}`,
    `.view-btn:hover{background:#1976d2;color:#fff;transform:scale(1.05);}`,
    `.edit-btn{background:#fff3e0;color:#f57c00;}`,
    `.edit-btn:hover{background:#f57c00;color:#fff;transform:scale(1.05);}`,
    `.delete-btn{background:#ffebee;color:#d32f2f;}`,
    `.delete-btn:hover{background:#d32f2f;color:#fff;transform:scale(1.05);}`,
    `.empty-state{background:#fff;border-radius:20px;padding:4rem 2rem;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.08);}`,
    `.empty-icon{width:120px;height:120px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 2rem;color:#fff;font-size:3rem;box-shadow:0 10px 40px rgba(102,126,234,.3);}`,
    `.empty-state h3{font-size:1.75rem;color:#212529;margin-bottom:1rem;}`,
    `.empty-state p{font-size:1.1rem;color:#6c757d;margin-bottom:2rem;}`,
    `.empty-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;}`,
    `.btn-primary-modern,.btn-secondary-modern{padding:.875rem 2rem;border-radius:12px;border:none;font-weight:600;font-size:1rem;cursor:pointer;display:flex;align-items:center;gap:.5rem;transition:all .3s ease;}`,
    `.btn-primary-modern{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;box-shadow:0 4px 15px rgba(102,126,234,.4);}`,
    `.btn-primary-modern:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(102,126,234,.5);}`,
    `.btn-secondary-modern{background:#fff;color:#6c757d;border:2px solid #e9ecef;}`,
    `.btn-secondary-modern:hover{border-color:#6c757d;color:#212529;}`,
    `.roles-grid{display:flex;flex-wrap:wrap;gap:.75rem;}`,
    `.role-option{display:flex;align-items:center;gap:.5rem;background:#f8f9fa;border:1px solid #e9ecef;border-radius:10px;padding:.5rem .75rem;cursor:pointer;}`,
    `.role-option input{accent-color:#667eea;}`,
    `.modal-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1040;backdrop-filter:blur(4px);}`,
    `.modal-wrapper{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:1050;padding:1rem;}`,
    `.modal-content{background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:600px;width:100%;max-height:90vh;overflow-y:auto;}`,
    `.modal-header{padding:1.25rem 1.25rem 0.75rem;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;}`,
    `.modal-title{font-size:1.25rem;font-weight:700;color:#212529;margin:0;display:flex;align-items:center;gap:.5rem;}`,
    `.btn-close{background:none;border:none;font-size:1.25rem;color:#6c757d;cursor:pointer;padding:.5rem;border-radius:8px;display:flex;align-items:center;justify-content:center;width:36px;height:36px;}`,
    `.btn-close:hover{background:#f0f0f0;color:#212529;}`,
    `.modal-body{padding:1.25rem;}`,
    `.modal-footer{padding:0.75rem 1.25rem 1.25rem;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:0.75rem;}`,
    /* Modern view modal */
    `.view-modal{display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.85));border-radius:20px;overflow:hidden}`,
    `.view-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border-top-left-radius:20px;border-top-right-radius:20px;box-shadow:inset 0 -1px 0 rgba(255,255,255,.25)}`,
    `.view-header-left{display:flex;align-items:center;gap:1rem}`,
    `.view-avatar{width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.18);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.25rem;border:2px solid rgba(255,255,255,.35);box-shadow:0 8px 24px rgba(0,0,0,.15)}`,
    `.view-title h3{margin:0;font-size:1.25rem;font-weight:700}`,
    `.view-title p{margin:0;opacity:.9}`,
    `.view-title .at{opacity:.85;margin-right:2px}`,
    `.view-status{display:flex;align-items:center;gap:.5rem;font-weight:600;background:rgba(255,255,255,.2);padding:.35rem .75rem;border-radius:999px}`,
    `.view-status .dot{width:8px;height:8px;border-radius:999px;background:#38ef7d;display:inline-block}`,
    `.view-status.inactive .dot{background:#ff6b6b}`,
    `.view-body{padding:1.25rem 1.5rem}`,
    `.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}`,
    `.info-item{background:rgba(255,255,255,.9);border:1px solid #eef0f3;border-radius:14px;padding:.9rem 1rem;box-shadow:0 6px 20px rgba(0,0,0,.06)}`,
    `.info-label{font-size:.85rem;color:#6c757d;display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem}`,
    `.info-value{font-weight:600}`,
    `.info-value.roles{display:flex;flex-wrap:wrap;gap:.5rem}`,
    `.chip{background:linear-gradient(135deg,#eef2ff,#e3f2fd);color:#3b5bdb;border:1px solid #dbe4ff;padding:4px 10px;border-radius:999px;font-size:12px;box-shadow:0 4px 12px rgba(59,91,219,.15)}`,
    `.badges{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem}`,
    `.badge{display:flex;align-items:center;gap:.5rem;background:#fff;border:1px solid #e9ecef;border-radius:12px;padding:.5rem .75rem;color:#495057;box-shadow:0 6px 18px rgba(0,0,0,.06)}`,
    `.view-footer{padding:1rem 1.5rem;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:.5rem;background:linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,255,255,.9))}`,
    `.btn-light-outline{background:#fff;border:2px solid #e9ecef;color:#495057;border-radius:10px;padding:.6rem 1rem;font-weight:600}`,
    `.btn-light-outline:hover{border-color:#adb5bd}`,
    `.btn-roles-modern{background:linear-gradient(135deg,#06b6d4,#22c55e);color:#fff;border:none;border-radius:10px;padding:.6rem 1rem;font-weight:700;box-shadow:0 8px 22px rgba(6,182,212,.25);cursor:pointer}`,
    `.btn-roles-modern:hover{filter:brightness(1.05)}`,
    `.btn-primary-modern{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border:none;border-radius:10px;padding:.6rem 1rem;font-weight:700;box-shadow:0 8px 22px rgba(102,126,234,.35);cursor:pointer}`,
    `.btn-primary-modern:hover{filter:brightness(1.05)}`,
    `.btn-secondary-modern{background:#eef1f4;border:2px solid #e9ecef;color:#495057;border-radius:10px;padding:.6rem 1rem;font-weight:600;cursor:pointer}`,
    `.btn-secondary-modern:hover{background:#e9ecef}`,
    `.btn-danger-modern{background:linear-gradient(135deg,#ff6b6b,#d32f2f);color:#fff;border:none;border-radius:10px;padding:.6rem 1rem;font-weight:700;box-shadow:0 8px 22px rgba(211,47,47,.35);cursor:pointer}`,
    `.btn-danger-modern:hover{filter:brightness(1.05)}`,
    `@media (max-width:768px){.page-header{padding:2rem 1.5rem}.header-content{flex-direction:column;align-items:flex-start}.page-title{font-size:2rem}.title-icon{width:50px;height:50px;font-size:1.25rem}.btn-add-user{width:100%;justify-content:center}.users-grid{grid-template-columns:1fr}.user-card-footer{flex-direction:column}.action-btn{width:100%}}`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  allRoles = signal<string[]>([]);
  isRolesModalOpen = signal<boolean>(false);
  selectedUserId = signal<string>('');
  selectedUserName = signal<string>('');
  selectedRoles = signal<string[]>([]);
  originalRoles = signal<string[]>([]);

  // Add/Edit User modal state
  isAddModalOpen = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);
  addModel = signal<{ username: string; email: string; password: string; firstName: string; lastName: string }>({ username: '', email: '', password: '', firstName: '', lastName: '' });
  editModel = signal<{ id: string; email: string; firstName: string; lastName: string; isActive?: boolean }>({ id: '', email: '', firstName: '', lastName: '' });
  addSelectedRoles = signal<string[]>([]);
  editSelectedRoles = signal<string[]>([]);
  editOriginalRoles = signal<string[]>([]);

  // View User modal state
  isViewModalOpen = signal<boolean>(false);
  viewUser = signal<User | null>(null);

  readonly users = signal<User[]>([]);

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(u => {
      const full = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        u.username.toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        full.includes(term)
      );
    });
  });

  readonly totalUsers = computed(() => this.users().length);
  readonly totalAdmins = computed(() => this.users().filter(u => u.roles.includes('Admin')).length);
  readonly distinctRoles = computed(() => Array.from(new Set(this.users().flatMap(u => u.roles))));

  onSearchInput(value: string): void {
    this.searchTerm.set(value ?? '');
  }

  // Validators
  isValidEmail(email?: string): boolean {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  isAddFormValid(): boolean {
    const m = this.addModel();
    const usernameOk = (m.username || '').trim().length >= 3;
    const passwordOk = (m.password || '').length >= 6;
    const emailOk = this.isValidEmail(m.email);
    return usernameOk && passwordOk && emailOk;
  }

  isEditFormValid(): boolean {
    const m = this.editModel();
    return this.isValidEmail(m.email);
  }

  isPromoteDoctorValid(): boolean {
    const m = this.promoteDoctorModel();
    return (m.firstName || '').trim().length > 0 && (m.lastName || '').trim().length > 0 && (m.departmentValue || 0) > 0;
  }

  isPromotePatientValid(): boolean {
    const m = this.promotePatientModel();
    const id = (m.identityNumber || '').replace(/\D/g, '');
    return (m.firstName || '').trim().length > 0 && (m.lastName || '').trim().length > 0 && id.length === 11;
  }

  constructor(private readonly userRoleService: UserRoleService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.userRoleService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Users could not be loaded');
        this.isLoading.set(false);
      }
    });
  }

  loadRoles(): void {
    this.userRoleService.getAllRoles().subscribe({
      next: (roles) => this.allRoles.set(roles.map(r => r.name.toString())),
      error: () => this.allRoles.set(['Admin', 'Doctor', 'Patient'])
    });
  }

  openRolesModal(user: User): void {
    this.selectedUserId.set(user.id);
    this.selectedUserName.set(`${user.firstName} ${user.lastName}`.trim() || user.username);
    const curr = [...(user.roles || []).map(r => r.toString())];
    this.selectedRoles.set(curr);
    this.originalRoles.set(curr);
    this.isRolesModalOpen.set(true);
  }

  closeRolesModal(): void {
    this.isRolesModalOpen.set(false);
    this.selectedUserId.set('');
    this.selectedUserName.set('');
    this.selectedRoles.set([]);
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().includes(role);
  }

  onRoleCheckboxChange(role: string, checked: boolean): void {
    const current = new Set(this.selectedRoles());
    if (checked) current.add(role); else current.delete(role);
    this.selectedRoles.set(Array.from(current));
  }

  saveUserRoles(): void {
    const userId = this.selectedUserId();
    const roles = this.selectedRoles();
    if (!userId) return;
    this.isLoading.set(true);
    this.userRoleService.updateUserRoles(userId, { roles }).subscribe({
      next: () => {
        const updated = this.users().map(u => u.id === userId ? { ...u, roles: roles } : u);
        this.users.set(updated);
        this.isLoading.set(false);
        const added = roles.filter(r => !this.originalRoles().includes(r));
        this.closeRolesModal();
        if (added.includes('Doctor') && added.includes('Patient')) {
          this.nextPromote.set('patient');
          this.openPromoteDoctorModal(userId);
        } else if (added.includes('Doctor')) {
          this.nextPromote.set('none');
          this.openPromoteDoctorModal(userId);
        } else if (added.includes('Patient')) {
          this.openPromotePatientModal(userId);
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Roller güncellenemedi');
        this.isLoading.set(false);
      }
    });
  }

  // Promote Doctor / Patient modals
  isPromoteDoctorOpen = signal<boolean>(false);
  isPromotePatientOpen = signal<boolean>(false);
  nextPromote = signal<'none'|'patient'>('none');
  promoteDoctorModel = signal<{ firstName: string; lastName: string; departmentValue: number }>({ firstName: '', lastName: '', departmentValue: 0 });
  promotePatientModel = signal<{ firstName: string; lastName: string; identityNumber: string }>({ firstName: '', lastName: '', identityNumber: '' });
  departments = signal(ALL_DEPARTMENTS.map(d => ({ value: d.value, name: d.displayName })));

  openPromoteDoctorModal(userId: string): void {
    const u = this.users().find(x => x.id === userId);
    this.promoteDoctorModel.set({ firstName: u?.firstName || '', lastName: u?.lastName || '', departmentValue: 0 });
    this.isPromoteDoctorOpen.set(true);
  }

  openPromotePatientModal(userId: string): void {
    const u = this.users().find(x => x.id === userId);
    this.promotePatientModel.set({ firstName: u?.firstName || '', lastName: u?.lastName || '', identityNumber: '' });
    this.isPromotePatientOpen.set(true);
  }

  closePromoteDoctorModal(): void { this.isPromoteDoctorOpen.set(false); }
  closePromotePatientModal(): void { this.isPromotePatientOpen.set(false); }

  submitPromoteDoctor(): void {
    const userId = this.selectedUserId() || (this.users().find(u => u.firstName === this.promoteDoctorModel().firstName && u.lastName === this.promoteDoctorModel().lastName)?.id || '');
    if (!userId) { this.closePromoteDoctorModal(); return; }
    const m = this.promoteDoctorModel();
    if (!this.isPromoteDoctorValid()) { Swal.fire({ icon: 'warning', title: 'Zorunlu alanlar', text: 'Ad, Soyad ve Departman zorunludur.' }); return; }
    this.isLoading.set(true);
    this.userRoleService.promoteToDoctor(userId, { firstName: m.firstName.trim(), lastName: m.lastName.trim(), departmentValue: m.departmentValue }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closePromoteDoctorModal();
        if (this.nextPromote() === 'patient') {
          this.nextPromote.set('none');
          this.openPromotePatientModal(userId);
        }
      },
      error: (e) => { alert(e?.error?.message || 'Doktor kaydı oluşturulamadı'); this.isLoading.set(false); }
    });
  }

  submitPromotePatient(): void {
    const userId = this.selectedUserId() || (this.users().find(u => u.firstName === this.promotePatientModel().firstName && u.lastName === this.promotePatientModel().lastName)?.id || '');
    if (!userId) { this.closePromotePatientModal(); return; }
    const m = this.promotePatientModel();
    const idClean = (m.identityNumber || '').replace(/\D/g, '').slice(0, 11);
    if (!/^\d{11}$/.test(idClean)) { Swal.fire({ icon: 'warning', title: 'Geçersiz T.C. Kimlik No', text: '11 haneli numerik olmalıdır.' }); return; }
    this.promotePatientModel.set({ ...m, identityNumber: idClean });
    this.isLoading.set(true);
    this.userRoleService.promoteToPatient(userId, { firstName: m.firstName.trim(), lastName: m.lastName.trim(), identityNumber: m.identityNumber.trim() }).subscribe({
      next: () => { this.isLoading.set(false); this.closePromotePatientModal(); },
      error: (e) => { alert(e?.error?.message || 'Hasta kaydı oluşturulamadı'); this.isLoading.set(false); }
    });
  }

  openAddUserModal(): void {
    this.addModel.set({ username: '', email: '', password: '', firstName: '', lastName: '' });
    this.addSelectedRoles.set([]);
    this.isAddModalOpen.set(true);
  }

  closeAddUserModal(): void {
    this.isAddModalOpen.set(false);
  }

  createUser(): void {
    const m = this.addModel();
    if (!this.isAddFormValid()) { Swal.fire({ icon: 'warning', title: 'Eksik/Geçersiz bilgi', text: 'Kullanıcı adı en az 3, şifre en az 6 karakter olmalı. Email geçerli formatta olmalı.' }); return; }
    this.isLoading.set(true);
    this.userRoleService.createUser({ username: m.username.trim(), email: (m.email||'').trim(), password: m.password, firstName: (m.firstName||'').trim(), lastName: (m.lastName||'').trim() }).subscribe({
      next: (user) => {
        if (user && user.id) {
          const roles = this.addSelectedRoles();
          if (roles.length > 0) {
            this.userRoleService.updateUserRoles(user.id, { roles }).subscribe({
              next: (res) => {
                this.users.set([{ ...user, roles }, ...this.users()]);
                this.isAddModalOpen.set(false);
                this.isLoading.set(false);
                // Promote flows after creation if selected
                this.selectedUserId.set(user.id);
                if (roles.includes('Doctor') && roles.includes('Patient')) {
                  this.nextPromote.set('patient');
                  this.openPromoteDoctorModal(user.id);
                } else if (roles.includes('Doctor')) {
                  this.nextPromote.set('none');
                  this.openPromoteDoctorModal(user.id);
                } else if (roles.includes('Patient')) {
                  this.openPromotePatientModal(user.id);
                }
              },
              error: () => {
                this.users.set([user, ...this.users()]);
                this.isAddModalOpen.set(false);
                this.isLoading.set(false);
              }
            });
            return;
          } else {
            this.users.set([user, ...this.users()]);
            this.isAddModalOpen.set(false);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => { alert(err?.error?.message || 'Kullanıcı oluşturulamadı'); this.isLoading.set(false); }
    });
  }

  openEditUserModal(user: User): void {
    this.editModel.set({ id: user.id, email: user.email || '', firstName: user.firstName || '', lastName: user.lastName || '' });
    const roles = [...(user.roles || []).map(r => r.toString())];
    this.editSelectedRoles.set(roles);
    this.editOriginalRoles.set(roles);
    this.isEditModalOpen.set(true);
  }

  closeEditUserModal(): void {
    this.isEditModalOpen.set(false);
  }

  updateUser(): void {
    const m = this.editModel();
    if (!m.id) return;
    if (!this.isEditFormValid()) { Swal.fire({ icon: 'warning', title: 'Geçersiz e-posta', text: 'Lütfen geçerli bir e-posta giriniz.' }); return; }
    this.isLoading.set(true);
    this.userRoleService.updateUser(m.id, { email: (m.email||'').trim(), firstName: (m.firstName||'').trim(), lastName: (m.lastName||'').trim() }).subscribe({
      next: (updated) => {
        const list = this.users().map(u => u.id === updated.id ? { ...u, email: updated.email, firstName: updated.firstName, lastName: updated.lastName } : u);
        this.users.set(list);
        // roles diff
        const targetRoles = this.editSelectedRoles();
        const orig = this.editOriginalRoles();
        const changed = targetRoles.length !== orig.length || targetRoles.some(r => !orig.includes(r)) || orig.some(r => !targetRoles.includes(r));
        if (!changed) {
          this.isEditModalOpen.set(false);
          this.isLoading.set(false);
          return;
        }
        this.userRoleService.updateUserRoles(updated.id, { roles: targetRoles }).subscribe({
          next: () => {
            const list2 = this.users().map(u => u.id === updated.id ? { ...u, roles: targetRoles } : u);
            this.users.set(list2);
            this.isEditModalOpen.set(false);
            this.isLoading.set(false);
            const added = targetRoles.filter(r => !orig.includes(r));
            if (added.includes('Doctor') && added.includes('Patient')) {
              this.nextPromote.set('patient');
              this.openPromoteDoctorModal(updated.id);
            } else if (added.includes('Doctor')) {
              this.nextPromote.set('none');
              this.openPromoteDoctorModal(updated.id);
            } else if (added.includes('Patient')) {
              this.openPromotePatientModal(updated.id);
            }
          },
          error: (e) => { alert(e?.error?.message || 'Roller güncellenemedi'); this.isLoading.set(false); }
        });
      },
      error: (err) => { alert(err?.error?.message || 'Kullanıcı güncellenemedi'); this.isLoading.set(false); }
    });
  }

  async deleteUser(user: User): Promise<void> {
    const res = await Swal.fire({
      title: 'Kullanıcıyı sil?',
      text: `${user.username} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, sil',
      cancelButtonText: 'Vazgeç',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true
    });
    if (!res.isConfirmed) return;
    this.isLoading.set(true);
    this.userRoleService.deleteUser(user.id).subscribe({
      next: async () => {
        this.users.set(this.users().filter(u => u.id !== user.id));
        this.isLoading.set(false);
        await Swal.fire({ title: 'Silindi', text: 'Kullanıcı başarıyla silindi.', icon: 'success', timer: 1500, showConfirmButton: false });
      },
      error: async (err) => {
        this.isLoading.set(false);
        await Swal.fire({ title: 'Hata', text: err?.error?.message || 'Kullanıcı silinemedi', icon: 'error' });
      }
    });
  }

  onAddChange(field: 'username'|'email'|'password'|'firstName'|'lastName', value: string): void {
    const m = this.addModel();
    this.addModel.set({ ...m, [field]: value });
  }

  onEditChange(field: 'email'|'firstName'|'lastName', value: string): void {
    const m = this.editModel();
    this.editModel.set({ ...m, [field]: value });
  }

  onEditRoleCheckboxChange(role: string, checked: boolean): void {
    const current = new Set(this.editSelectedRoles());
    if (checked) current.add(role); else current.delete(role);
    this.editSelectedRoles.set(Array.from(current));
  }

  onAddRoleCheckboxChange(role: string, checked: boolean): void {
    const current = new Set(this.addSelectedRoles());
    if (checked) current.add(role); else current.delete(role);
    this.addSelectedRoles.set(Array.from(current));
  }

  onPromoteDoctorChange(field: 'firstName'|'lastName', value: string): void {
    const m = this.promoteDoctorModel();
    this.promoteDoctorModel.set({ ...m, [field]: value });
  }

  onPromoteDoctorDeptChange(value: any): void {
    const m = this.promoteDoctorModel();
    const v = Number(value) || 0;
    this.promoteDoctorModel.set({ ...m, departmentValue: v });
  }

  onPromotePatientChange(field: 'firstName'|'lastName'|'identityNumber', value: string): void {
    const m = this.promotePatientModel();
    if (field === 'identityNumber') {
      const cleaned = (value || '').replace(/\D/g, '').slice(0, 11);
      this.promotePatientModel.set({ ...m, identityNumber: cleaned });
      return;
    }
    this.promotePatientModel.set({ ...m, [field]: value });
  }

  // View User modal actions
  openViewUserModal(user: User): void {
    this.viewUser.set(user);
    this.isViewModalOpen.set(true);
  }

  closeViewUserModal(): void {
    this.isViewModalOpen.set(false);
    this.viewUser.set(null);
  }

  onViewEditClick(): void {
    const u = this.viewUser();
    if (!u) return;
    this.closeViewUserModal();
    this.openEditUserModal(u);
  }

  onViewRolesClick(): void {
    const u = this.viewUser();
    if (!u) return;
    this.closeViewUserModal();
    this.openRolesModal(u);
  }
}


