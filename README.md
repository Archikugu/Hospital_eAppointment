# Hospital eAppointment System

A full-stack hospital appointment management system built with Clean Architecture, .NET 9, and Angular.

## Project Structure

```
Hospital_eAppointment/
├── eAppointmentClient/          # Angular Frontend Application
└── eAppointmentServer/          # .NET 9 Backend API
    ├── eAppointment.Domain/     # Domain Layer (Entities, Enums, Interfaces)
    ├── eAppointment.Application/# Application Layer (CQRS, Handlers, Services)
    ├── eAppointment.Infrastructure/# Infrastructure Layer (DbContext, Repositories, Services)
    └── eAppointment.WebAPI/     # Web API Layer (Controllers, Configuration)
```

## Architecture

- **Clean Architecture**: Separation of concerns with Domain, Application, Infrastructure, and Presentation layers
- **CQRS Pattern**: Using MediatR for command and query separation
- **Repository Pattern**: Generic and specific repositories with Unit of Work
- **JWT Authentication**: Secure token-based authentication
- **Entity Framework Core**: ORM with SQL Server

## Technologies

### Backend
- .NET 9
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- MediatR
- JWT Bearer Authentication
- ASP.NET Core Identity

### Frontend
- Angular (latest)
- TypeScript
- RxJS

## Getting Started

### Prerequisites
- .NET 9 SDK
- Node.js and npm
- SQL Server (LocalDB or SQL Server)

### Backend Setup

1. Navigate to the server directory:
```bash
cd eAppointmentServer
```

2. Update connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "SqlServer": "Your-Connection-String-Here"
  }
}
```

3. Run migrations:
```bash
dotnet ef database update --project eAppointment.Infrastructure --startup-project eAppointment.WebAPI
```

4. Run the API:
```bash
cd eAppointment.WebAPI
dotnet run
```

The API will be available at `https://localhost:7081` or `http://localhost:5233`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd eAppointmentClient
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
ng serve
```

The frontend will be available at `http://localhost:4200`

## Default Admin User

- **Username:** `admin`
- **Email:** `admin@admin.com`
- **Password:** `Admin123!`

## API Documentation

Swagger UI is available at `/swagger` when running in Development mode.

## License

This project is licensed under the MIT License.

