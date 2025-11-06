import { Routes } from '@angular/router';
import { LayoutsComponent } from './components/layouts/layouts.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { DoctorsComponent } from './components/doctors/doctors.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { UsersComponent } from './components/users/users.component';
import { authGuard } from './services/auth.service';

export const routes: Routes = [
    {
        path: "login",
        component: LoginComponent
    },
    {
        path: "",
        component: LayoutsComponent,
        canActivateChild: [authGuard],
        children: [
            {
                path: "",
                component: HomeComponent
            },
            {
                path: "appointments",
                component: AppointmentsComponent
            },
            {
                path: "doctors",
                component: DoctorsComponent
            },
            {
                path: "patients",
                loadComponent: () => import('./components/patients/patients.component').then(m => m.PatientsComponent)
            }
            ,
            {
                path: "users",
                component: UsersComponent
            }
        ]
    },
    {
        path: "**",
        component: NotFoundComponent
    }
];
