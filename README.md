# Sales Dashboard - PostgreSQL Integration

Sales analysis dashboard dengan PostgreSQL database integration untuk upload Excel/CSV data penjualan.

## Features

### 📊 **Dashboard Analisis**
- **Ringkasan**: Overview metrik utama dengan cards dan charts
- **Perbandingan Mingguan**: Week 1-52 comparison dengan filter produk
- **Analisis Kuartal**: Q1-Q4 target/actual/variance analysis
- **L4W vs C4W**: Last 4 Weeks vs Current 4 Weeks trend analysis
- **Tahun ke Tahun**: YoY growth analysis dengan multiple metrics
- **Kontribusi Outlet**: Analisis kontribusi outlet dengan filter:
  - Tipe outlet (Retail, Whole Sale, dll)
  - Kategori produk (SKT, SKM, dll)
  - Produk spesifik (CAKRA PRIMA 16 K, dll)

### 🗂️ **Admin Management**
- **Upload Data**: Excel/CSV upload dengan area assignment
  - Drag & drop file upload
  - Area selection dropdown
  - Real-time data processing
  - Validation dan error handling
- **Management Area**: CRUD operations untuk area configuration
  - Add/Edit/Delete area dengan ID, nama, deskripsi
  - Persistent storage (JSON file)
  - Auto-refresh data
- **Settings**: Database migration tools
  - Add area column migration
  - Database statistics monitoring

### 🗄️ **Database Features**
- **PostgreSQL Integration**: Complete schema dengan relationships
- **Area Management**: Area-based data organization
- **File Tracking**: Upload history dan file management
- **Data Validation**: Comprehensive input validation
- **Migration Support**: Database schema updates

## Tech Stack

### **Frontend**
- **Next.js 16.1.1** - React framework dengan App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### **Backend & Data**
- **PostgreSQL** - Primary database
- **Recharts** - Chart library untuk visualisasi data
- **XLSX** - Excel file processing
- **Formidable** - File upload handling

### **Development Tools**
- **ESLint & Prettier** - Code quality
- **Hot Reload** - Fast development cycle
- **API Routes** - Next.js API endpoints

## Setup Instructions

### 1. Prerequisites
```bash
# Node.js 18+ required
node --version

# PostgreSQL 12+ required
psql --version
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb dashboard_db

# Create user (optional)
psql -d postgres -c "CREATE USER dashboard_user WITH PASSWORD 'your_password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE dashboard_db TO dashboard_user;"

# Run schema
psql dashboard_db < database/schema.sql
```

### 3. Environment Variables

Create `.env.local`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard_db
DB_USER=postgres
DB_PASSWORD=your_password

# Next.js Configuration
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Database URL (alternative to individual DB vars)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/dashboard_db
```

### 4. Install Dependencies

```bash
npm install
# atau
yarn install
```

### 5. Run Development Server

```bash
npm run dev
# atau
yarn dev
```

**Access URLs:**
- 🏠 **Dashboard**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

## File Upload Format

### **Required Columns**
Excel/CSV files harus memiliki kolom berikut (case-sensitive):

| Column | Description | Example |
|--------|-------------|---------|
| Grand Total | Total penjualan | 50000 |
| Minggu | Nomor minggu (1-52) | 1 |
| Tanggal | Tanggal transaksi | 2024-01-01 |
| Produk | Nama produk | Produk |
| Kategori | Kategori produk | Kategori |
| Customer | Nama customer | Customer |
| Customer_Type | Tipe customer | Customer_Type |
| Salesman | Nama salesman | Salesman |
| Village | Desa/Kelurahan | Village |
| District | Kecamatan | Cimenyan |
| City | Kota/Kabupaten | Kabupaten Bandung |
| Units_BKS | Units BKS | 2.000 |
| Units_Slop | Units Slop | 0.200 |
| Units_Bal | Units Bal | 0.020 |
| Units_Dos | Units Dos | 0.003 |
| Omzet | Omzet Nett | 21600.00 |

### **Sample Excel Structure**
```
| Grand Total | Minggu | Tanggal    | Produk                  | Kategori                     | Customer | Customer_Type | Salesman      | Village  | District | City                | Units_BKS | Units_Slop | Units_Bal | Units_Dos | Omzet     |
|-------------|--------|------------|-------------------------|------------------------------|----------|---------------|---------------|----------|----------|---------------------|-----------|------------|------------|-----------|-----------|
| 21600.00    | 1      | 2024-01-01 | Produk       | Sigaret Kretek Tangan (SKT)  | Pelanggan    | Retail        | Salesman | Padasuka  | Cimenyan | Kabupaten Bandung   | 2000      | 200        | 20        | 3         | 21600.00  |
```

## API Endpoints

### **Sales Data**
- `GET /api/sales` - Fetch sales data dengan filter parameters
  - Query params: `year1`, `year2`, `weekStart1`, `weekEnd1`, `weekStart2`, `weekEnd2`, `product`, `city`, `area`
- `POST /api/sales` - Insert new sales records (internal use)

### **File Management**
- `POST /api/upload` - Upload Excel/CSV file dengan area assignment
- `GET /api/files` - Get uploaded files list
- `DELETE /api/files/[id]` - Delete file dan associated records

### **Area Management**
- `GET /api/areas` - Get all areas (default + custom)
- `POST /api/areas` - CRUD operations untuk areas
  - Body: `{ action: 'add|update|delete', area: { id, name, description } }`

### **System**
- `GET /api/stats` - Database statistics
- `POST /api/migrate` - Database migration tools
- `GET /api/cities` - Get available cities (dengan year filter)

### **Categories**
- `GET /api/categories` - Get unique product categories

## Database Schema

### **Primary Tables**
```sql
-- Sales records table
CREATE TABLE sales_records (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES uploaded_files(id),
    week INTEGER,
    date DATE,
    product VARCHAR(255),
    category VARCHAR(255),
    customer VARCHAR(255),
    customer_type VARCHAR(100),
    salesman VARCHAR(255),
    village VARCHAR(255),
    district VARCHAR(255),
    city VARCHAR(255),
    area VARCHAR(100),
    units_bks VARCHAR(20),
    units_slop VARCHAR(20),
    units_bal VARCHAR(20),
    units_dos VARCHAR(20),
    omzet DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded files tracking
CREATE TABLE uploaded_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255),
    original_name VARCHAR(255),
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_count INTEGER DEFAULT 0
);
```

### **Area Storage**
- **File-based**: `data/areas.json` untuk custom areas
- **Default areas**: `lib/areaConfig.ts` untuk fallback

## Development

### **Available Scripts**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues

# Database (if needed)
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database (if available)
```

### **Project Structure**
```
dashboard2y2/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── sales/         # Sales data endpoints
│   │   ├── upload/        # File upload
│   │   ├── files/         # File management
│   │   ├── areas/         # Area management
│   │   ├── cities/        # City metadata
│   │   ├── products/      # Product metadata and categories
│   │   ├── stats/         # System statistics
│   │   ├── users/         # User-related endpoints
│   │   ├── migrate/       # Database migrations
│   │   └── ...            # Additional API route groups
│   ├── admin/             # Admin panel pages
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── OutletContributionSection.tsx
│   ├── WeekComparison.tsx
│   └── ...
├── lib/                   # Utilities and helpers
│   ├── database.ts        # Data processing
│   ├── db.ts              # Database connection
│   ├── areaConfig.ts      # Area configuration
│   ├── productCategories.ts
│   └── utils.ts
├── types/                 # TypeScript types
│   └── sales.ts
├── data/                  # Persistent data
│   └── areas.json         # Custom areas
├── database/              # SQL schemas
│   └── schema.sql
├── migrations/            # DB migration scripts
├── public/                # Static assets
├── scripts/               # Utility and maintenance scripts
└── README.md              # Project documentation
```

## Deployment

### **Production Setup**

1. **Database Setup**
```bash
# Create production database
createdb dashboard_prod

# Run schema
psql dashboard_prod < database/schema.sql
```

2. **Environment Variables**
```env
NODE_ENV=production
DB_HOST=your-production-host
DB_PORT=5432
DB_NAME=dashboard_prod
DB_USER=dashboard_user
DB_PASSWORD=secure_production_password
NEXTAUTH_SECRET=production_secret_key
```

3. **Build and Deploy**
```bash
npm run build
npm start
```

### **Docker Deployment (Optional)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Features Deep Dive

### **Area Management System**
- **Default Areas**: Pre-configured areas di `lib/areaConfig.ts`
- **Custom Areas**: User-defined areas di `data/areas.json`
- **Persistent Storage**: Areas survive server restarts
- **API Integration**: Full CRUD operations

### **Advanced Filtering**
- **Multi-level Filters**: Area → City → Product → Category
- **Real-time Updates**: Charts update instantly pada perubahan filter
- **URL State**: Filter state disimpan di URL
- **Responsive UI**: Filter interface yang responsif

### **Data Processing**
- **Excel/CSV Support**: Multiple file formats
- **Validation**: Data integrity checks
- **Error Handling**: Comprehensive error reporting
- **Batch Processing**: Efficient large file handling

## Troubleshooting

### **Common Issues**

1. **Database Connection**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -p 5432 -U postgres -d dashboard_db
```

2. **File Upload Issues**
- Check file format (Excel/CSV)
- Verifikasi kolom yang dibutuhkan
- Check limit ukuran file

3. **Area Management**
- Verify `data/` folder permissions
- Check JSON file format
- Review API response logs

### **Debug Mode**
Enable debug logging:
```env
DEBUG=app:*
```
