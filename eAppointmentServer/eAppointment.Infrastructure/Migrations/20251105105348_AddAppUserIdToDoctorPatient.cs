using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eAppointment.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppUserIdToDoctorPatient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AppUserId",
                table: "Patients",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AppUserId",
                table: "Doctors",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "Doctors");
        }
    }
}
