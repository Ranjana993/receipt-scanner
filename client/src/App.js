import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setReceiptData(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/process-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt');
      }

      const data = await response.json();
      setReceiptData(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to process the receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Receipt Scanner</h1>
      </header>
      <main className="App-main">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="upload-button"
          >
            {loading ? 'Processing...' : 'Process Receipt'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="preview-section">
          {preview && (
            <div className="image-preview">
              <h3>Receipt Preview:</h3>
              <img src={preview} alt="Preview" />
            </div>
          )}

          {receiptData && (
            <div className="receipt-data">
              <h3>Extracted Information:</h3>
              <div className="receipt-details">
                <div className="receipt-header">
                  <p><strong>Merchant:</strong> {receiptData.parsedReceipt.merchant}</p>
                  <p><strong>Date:</strong> {receiptData.parsedReceipt.date}</p>
                  <p><strong>Total:</strong> {receiptData.parsedReceipt.total}</p>
                </div>
                
                <div className="receipt-items">
                  <h4>Items:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.parsedReceipt.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="raw-text">
                  <h4>Raw Text:</h4>
                  <pre>{receiptData.rawText}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
