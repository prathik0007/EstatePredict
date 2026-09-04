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
    required: [true, 'Please provide nightly rental price ($ USD/night)']
  },
  listingType: {
    type: String,
    enum: ['Rent', 'Short-Stay', 'Sale'],
    default: 'Rent'
  },
  propertyType: {
    type: String,
    enum: ['Entire home', 'Entire rental unit', 'Entire guest suite', 'Entire guesthouse', 'Private room in home', 'Entire cottage', 'Apartment', 'House', 'Villa', 'Condominium', 'Other'],
    default: 'Entire home'
  },
  roomType: {
    type: String,
    enum: ['Entire home/apt', 'Private room', 'Shared room', 'Hotel room'],
    default: 'Entire home/apt'
  },
  accommodates: {
    type: Number,
    default: 4,
    min: 1,
    max: 30
  },
  bedrooms: {
    type: Number,
    default: 2,
    min: 0,
    max: 20
  },
  beds: {
    type: Number,
    default: 2,
    min: 1,
    max: 30
  },
  bathrooms: {
    type: Number,
    default: 1.5,
    min: 0.5,
    max: 20
  },
  bhk: {
    type: Number,
    default: 2
  },
  size: {
    type: Number,
    default: 1000
  },
  minNights: {
    type: Number,
    default: 2
  },
  isSuperhost: {
    type: Boolean,
    default: false
  },
  location: {
    address: { type: String, required: true },
    city: {
      type: String,
      default: 'Asheville'
    },
    neighborhood: { type: String, default: 'Downtown' },
    state: { type: String, default: 'NC' },
    pincode: { type: String, default: '28801' },
    coordinates: {
      lat: { type: Number, required: true, default: 35.5951 },
      lng: { type: Number, required: true, default: -82.5515 }
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
    confidenceLevel: { type: String, default: '95% Prediction Interval' },
    empiricalCoverage: { type: String, default: '93.70%' },
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
  'location.city': 'text',
  'location.neighborhood': 'text'
});

module.exports = mongoose.model('Property', propertySchema);
