class Batch {
  constructor(data) {
    this.batchId = data.batchId;
    this.productType = data.productType;
    this.quantity = data.quantity;
    this.productionDate = data.productionDate;
    this.expiryDate = data.expiryDate;
    this.status = data.status || 'At Farm';
    this.checkpoints = data.checkpoints || 1;
    this.currentLocation = data.currentLocation || 'Farm';
    this.producer = data.producer;
    this.fssaiLicense = data.fssaiLicense;
    this.hasIssues = data.hasIssues || false;
  }

  // Check if batch is expired
  isExpired() {
    return new Date(this.expiryDate) < new Date();
  }

  // Calculate days until expiry
  daysUntilExpiry() {
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Get status color
  getStatusColor() {
    switch (this.status) {
      case 'In Transit':
        return '#FF9800';
      case 'Delivered':
        return '#4CAF50';
      case 'At Warehouse':
        return '#2196F3';
      case 'At Farm':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  }

  // Convert to JSON for API
  toJSON() {
    return {
      batchId: this.batchId,
      productType: this.productType,
      quantity: this.quantity,
      productionDate: this.productionDate,
      expiryDate: this.expiryDate,
      status: this.status,
      checkpoints: this.checkpoints,
      currentLocation: this.currentLocation,
      producer: this.producer,
      fssaiLicense: this.fssaiLicense,
      hasIssues: this.hasIssues,
    };
  }

  // Create from API response
  static fromJSON(data) {
    return new Batch(data);
  }

  // Generate unique batch ID
  static generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `BATCH-${timestamp}-${random}`;
  }
}

export default Batch;