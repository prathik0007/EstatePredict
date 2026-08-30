const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide property title'],
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    required: [true, 'Please provide property description'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide monthly rental price']
  },
  listingType: {
    type: String,
    enum: ['Rent', 'Sale'],
    default: 'Rent'
  },
  propertyType: {
    type: String,
    enum: ['Apartment', 'House', 'Villa', 'Condominium'],
    default: 'Apartment'
  },
  roomType: {
    type: String,
    enum: ['Entire home/apt', 'Private room', 'Shared room'],
    default: 'Entire home/apt'
  },
  bhk: {
    type: Number,
    required: [true, 'Please specify BHK'],
    min: 1,
    max: 10,
    default: 2
  },
  size: {
    type: Number,
    required: [true, 'Please specify size in sq.ft'],
    min: 50,
    max: 50000
  },
  bathroom: {
    type: Number,
    required: [true, 'Please specify number of bathrooms'],
    min: 1,
    max: 10,
    default: 2
  },
  bedrooms: {
    type: Number,
    default: 2
  },
  bathroomsAirbnb: {
    type: Number,
    default: 2.0
  },
  areaType: {
    type: String,
    enum: ['Super Area', 'Carpet Area', 'Built Area'],
    default: 'Super Area'
  },
  furnishingStatus: {
    type: String,
    enum: ['Unfurnished', 'Semi-Furnished', 'Furnished'],
    default: 'Semi-Furnished'
  },
  tenantPreferred: {
    type: String,
    enum: ['Bachelors', 'Family', 'Anyone'],
    default: 'Anyone'
  },
  location: {
    address: { type: String, required: true },
    city: {
      type: String,
      enum: ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai'],
      required: true
    },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, required: true, default: 19.0760 },
      lng: { type: Number, required: true, default: 72.8777 }
    }
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String
  }],
  predictedRentInfo: {
    predictedRent: { type: Number },
    lowerBound: { type: Number },
    upperBound: { type: Number },
    confidenceLevel: { type: String, default: '95%' },
    estimatedAt: { type: Date }
  },
  status: {
    type: String,
    enum: ['pending_approval', 'available', 'rented', 'rejected'],
    default: 'available'
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Text index for search
propertySchema.index({
  title: 'text',
  description: 'text',
  'location.address': 'text',
  'location.city': 'text'
});

module.exports = mongoose.model('Property', propertySchema);
