# Vendor Management Backend

A comprehensive Spring Boot 3 application for intelligent vendor onboarding and management system.

## Features

- **Vendor Onboarding Request**: Procurement team can initiate vendor onboarding with automated email invitations
- **OTP-Based Authentication**: Secure email-based OTP verification for vendor access
- **Comprehensive Vendor Form**: Capture business details, contact info, banking, and compliance information
- **Automated Validation**: Intelligent validation with automatic follow-up generation for missing/invalid data
- **Procurement Dashboard**: Centralized dashboard for managing all vendor requests and onboarding status
- **Follow-Up Management**: Both automatic and manual follow-up workflows
- **File Upload Support**: Support for business documents and compliance certificates
- **JWT Security**: Secure API endpoints with JWT-based authentication
- **Role-Based Access**: Different access levels for Admin, Procurement, and Vendor roles

## Technology Stack

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** with JWT authentication
- **Spring Data JPA** with SQL Server
- **Spring Mail** for email notifications
- **Lombok** for reducing boilerplate code
- **Apache POI & iText** for file processing
- **Swagger/OpenAPI** for API documentation
- **JUnit 5 & Mockito** for testing

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- SQL Server 2019 or higher
- SMTP server for email (Gmail recommended for development)

## Getting Started

### 1. Database Setup

Create a database in SQL Server:

```sql
CREATE DATABASE vendor_mgmt_dev;
```

### 2. Configuration

Update `src/main/resources/application-dev.yml` with your database and email credentials:

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=vendor_mgmt_dev;encrypt=true;trustServerCertificate=true
    username: your_db_username
    password: your_db_password
  mail:
    host: smtp.gmail.com
    port: 587
    username: your_email@gmail.com
    password: your_app_password
```

### 3. Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### 4. Access API Documentation

Swagger UI is available at: `http://localhost:8080/swagger-ui.html`

## Default Users

The application initializes with default users:

- **Admin**: 
  - Email: `admin@vendormanagement.com`
  - Password: `Admin@123`

- **Procurement**: 
  - Email: `procurement@vendormanagement.com`
  - Password: `Procurement@123`

## API Endpoints

### Vendor APIs (Public/OTP-Protected)

- `POST /api/vendor/otp/generate` - Generate and send OTP
- `POST /api/vendor/otp/verify` - Verify OTP and get JWT token
- `POST /api/vendor/onboarding` - Submit vendor onboarding form

### Procurement APIs (Authenticated)

- `POST /api/procurement/vendor/onboarding-request` - Create vendor onboarding request
- `GET /api/procurement/vendors` - Get all vendors (supports status filter)
- `GET /api/procurement/vendor/{id}` - Get vendor request details
- `GET /api/procurement/vendor/{id}/details` - Get complete vendor onboarding details
- `POST /api/procurement/vendor/{id}/follow-up` - Create manual follow-up
- `GET /api/procurement/vendor/{id}/follow-ups` - Get all follow-ups for a vendor
- `PUT /api/procurement/vendor/{id}/status` - Update vendor status
- `POST /api/procurement/vendor/{id}/resend-invitation` - Resend invitation email
- `PUT /api/procurement/follow-up/{followUpId}/resolve` - Mark follow-up as resolved

## Testing

Run tests with:

```bash
mvn test
```

## Project Structure

```
src/
├── main/
│   ├── java/com/evoke/vendor/
│   │   ├── config/          # Configuration classes
│   │   ├── controller/      # REST controllers
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── entity/         # JPA entities
│   │   ├── repository/     # JPA repositories
│   │   ├── security/       # Security components
│   │   ├── service/        # Business logic
│   │   ├── Constants.java
│   │   └── VendorManagementApplication.java
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       ├── application-prod.yml
│       └── db/migration/   # Database migration scripts
└── test/
    └── java/com/evoke/vendor/
        ├── integration/    # Integration tests
        ├── security/      # Security tests
        └── service/       # Service layer tests
```

## Workflow

1. **Vendor Request Creation**: Procurement team creates a vendor onboarding request
2. **Email Invitation**: System sends automated email with secure invitation link
3. **Vendor Authentication**: Vendor receives OTP via email for verification
4. **Form Submission**: Vendor completes onboarding form with all required details
5. **Automatic Validation**: System validates submitted data and creates follow-ups if needed
6. **Procurement Review**: Procurement team reviews submissions via dashboard
7. **Follow-Up Management**: Manual or automatic follow-ups for incomplete/invalid data
8. **Status Updates**: Track vendor progress through various onboarding stages

## Vendor Status Types

- `PENDING` - Initial request created, awaiting vendor response
- `IN_PROGRESS` - Vendor has submitted onboarding form
- `COMPLETED` - Onboarding successfully completed
- `DISCARDED` - Request discarded
- `FOLLOW_UP_REQUIRED` - Requires follow-up action

## Follow-Up Types

- `MISSING_DATA` - Required fields are missing
- `INCORRECT_DATA` - Data validation failed
- `INCORRECT_FILE` - File validation failed
- `DELAYED_RESPONSE` - Vendor hasn't responded
- `MANUAL` - Manual follow-up by procurement team

## Security

- JWT-based authentication for API access
- OTP verification for vendor email authentication
- Role-based access control (RBAC)
- Password encryption using BCrypt
- CORS configuration for frontend integration

## Environment Profiles

- `dev` - Development environment
- `prod` - Production environment
- `test` - Testing environment (uses H2 in-memory database)

## Building for Production

```bash
mvn clean package -Pprod
```

The executable JAR will be created in the `target/` directory.

## Docker Support

Build and run using Docker:

```bash
docker build -t vendor-mgmt-backend .
docker run -p 8080:8080 vendor-mgmt-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software for Evoke Technologies.

## Support

For support and queries, contact: support@vendormanagement.com