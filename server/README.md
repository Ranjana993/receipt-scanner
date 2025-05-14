# Receipt Scanner

A web application that uses Mindee API to extract structured information from receipts and invoices with high accuracy.

## Features

- Upload receipt/invoice images
- Real-time image preview
- Structured data extraction (merchant, date, total, tax, line items)
- High-accuracy receipt processing using Mindee API
- Clean and modern user interface
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Mindee API account and API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd receipt-ocr-app
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MINDEE_API_KEY=your-mindee-api-key
```

5. Set up Mindee:
   - Create an account at https://mindee.com
   - Get your API key from the dashboard
   - Update the `.env` file with your API key

## Running the Application

1. Start the backend server:
```bash
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd client
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click the file input to select a receipt/invoice image
2. Preview the image to ensure it's the correct one
3. Click "Process Receipt" to extract information
4. View the extracted structured data including:
   - Merchant name
   - Date
   - Total amount
   - Tax amount
   - Line items with descriptions, quantities, and amounts
   - Raw text from the receipt

## Technologies Used

- Frontend:
  - React
  - CSS3
  - HTML5

- Backend:
  - Node.js
  - Express
  - Mindee API
  - Multer (for file uploads)

## License

MIT 