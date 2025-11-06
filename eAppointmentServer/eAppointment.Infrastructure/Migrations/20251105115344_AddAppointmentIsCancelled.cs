using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eAppointment.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentIsCancelled : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_DoctorId_StartDate_EndDate",
                table: "Appointments");

            migrationBuilder.AddColumn<bool>(
                name: "IsCancelled",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId_StartDate_IsCancelled",
                table: "Appointments",
                columns: new[] { "DoctorId", "StartDate", "IsCancelled" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_DoctorId_StartDate_IsCancelled",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "IsCancelled",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId_StartDate_EndDate",
                table: "Appointments",
                columns: new[] { "DoctorId", "StartDate", "EndDate" });
        }
    }
}
