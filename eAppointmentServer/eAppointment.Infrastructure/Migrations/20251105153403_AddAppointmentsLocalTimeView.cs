using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eAppointment.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentsLocalTimeView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"IF OBJECT_ID(N'[dbo].[AppointmentsLocalTime]', N'V') IS NOT NULL
    DROP VIEW [dbo].[AppointmentsLocalTime];");

            migrationBuilder.Sql(@"CREATE VIEW [dbo].[AppointmentsLocalTime]
AS
SELECT
    a.Id,
    a.DoctorId,
    a.PatientId,
    a.StartDate AS StartDateUtc,
    a.EndDate   AS EndDateUtc,
    CAST((a.StartDate AT TIME ZONE 'UTC' AT TIME ZONE 'Turkey Standard Time') AS datetime2) AS StartDateLocal,
    CAST((a.EndDate   AT TIME ZONE 'UTC' AT TIME ZONE 'Turkey Standard Time') AS datetime2) AS EndDateLocal,
    a.IsCompleted,
    a.IsCancelled,
    a.Note
FROM [dbo].[Appointments] a;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[AppointmentsLocalTime]', N'V') IS NOT NULL
    DROP VIEW [dbo].[AppointmentsLocalTime];
");
        }
    }
}
