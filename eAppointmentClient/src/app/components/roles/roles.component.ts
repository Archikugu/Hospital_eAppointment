import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import type { Role } from '../../core/models/role.model';
import { UserRoleService } from '../../core/services/user-role.service';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.css']
})
export class RolesComponent {
    private rolesService = inject(UserRoleService);

    isBusy = signal(false);
    lastSyncResult = signal<string | null>(null);
    roles = signal<Role[]>([]);
    filterText = signal('');

    // Modal state
    showCreateModal = signal(false);
    showEditModal = signal(false);
    createName = signal('');
    editRole = signal<Role | null>(null);
    editName = signal('');
    isSubmitting = signal(false);

    ngOnInit(): void {
        this.loadRoles();
    }

    loadRoles(): void {
        this.isBusy.set(true);
        this.rolesService.getAllRoles().subscribe({
            next: (data) => this.roles.set(data),
            error: () => Swal.fire({ icon: 'error', title: 'Failed to load roles' }),
            complete: () => this.isBusy.set(false)
        });
    }

    get filteredRoles(): Role[] {
        const q = (this.filterText() || '').toLowerCase();
        if (!q) return this.roles();
        return this.roles().filter(r => (r.name || '').toString().toLowerCase().includes(q));
    }

    promptCreate(): void {
        this.createName.set('');
        this.showCreateModal.set(true);
    }

    createRole(): void {
        const name = (this.createName() || '').trim();
        if (!name) { return; }
        this.isSubmitting.set(true);
        this.rolesService.createRole(name).subscribe({
            next: () => { this.showCreateModal.set(false); this.loadRoles(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Role created', timer: 1500, timerProgressBar: true, showConfirmButton: false }); },
            error: (e) => Swal.fire({ icon: 'error', title: 'Create failed', text: e?.error?.message || 'Unexpected error' }),
            complete: () => this.isSubmitting.set(false)
        });
    }

    promptEdit(role: Role): void {
        this.editRole.set({ ...role });
        this.editName.set((role.name || '').toString());
        this.showEditModal.set(true);
    }

    updateRole(): void {
        const role = this.editRole();
        if (!role) return;
        const newName = (this.editName() || '').toString().trim();
        if (!newName) return;
        this.isSubmitting.set(true);
        this.rolesService.updateRole(role.id, newName).subscribe({
            next: () => { this.showEditModal.set(false); this.loadRoles(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Role updated', timer: 1500, timerProgressBar: true, showConfirmButton: false }); },
            error: (e) => Swal.fire({ icon: 'error', title: 'Update failed', text: e?.error?.message || 'Unexpected error' }),
            complete: () => this.isSubmitting.set(false)
        });
    }

    async confirmDelete(role: Role): Promise<void> {
        const res = await Swal.fire({
            title: 'Delete role?',
            text: `${role.name} will be permanently removed.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#dc3545'
        });
        if (!res.isConfirmed) return;
        this.isBusy.set(true);
        this.rolesService.deleteRole(role.id).subscribe({
            next: () => { this.loadRoles(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Role deleted', timer: 1500, timerProgressBar: true, showConfirmButton: false }); },
            error: (e) => Swal.fire({ icon: 'error', title: 'Delete failed', text: e?.error?.message || 'Cannot delete a role assigned to users' }),
            complete: () => this.isBusy.set(false)
        });
    }

    async syncRoles(prune: boolean): Promise<void> {
        if (this.isBusy()) { return; }
        this.isBusy.set(true);
        try {
            await this.rolesService.syncRoles(prune).toPromise();
            this.lastSyncResult.set(`Sync completed (prune=${prune}).`);
            await Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: prune ? 'Sync & prune completed' : 'Roles ensured', timer: 1500, timerProgressBar: true, showConfirmButton: false });
            this.loadRoles();
        } catch (err: any) {
            const message = err?.error || 'Unexpected error while syncing roles';
            this.lastSyncResult.set(message);
            await Swal.fire({ icon: 'error', title: 'Sync failed', text: message });
        } finally {
            this.isBusy.set(false);
        }
    }
}


