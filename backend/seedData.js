const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Wishlist = require('./models/Wishlist');
const Notification = require('./models/Notification');

dotenv.config();

const sampleProperties = [
  {
    title: 'Luxury 3 BHK Sea View Apartment in Bandra West',
    description: 'Stunning sea-facing high-rise 3 BHK apartment in Bandra West, Mumbai with Italian marble flooring, fully equipped modular kitchen, central AC, 24/7 security, club house, and dedicated covered car parking.',
    price: 85000,
    listingType: 'Rent',
    propertyType: 'Apartment',
    roomType: 'Entire home/apt',
    bhk: 3,
    size: 1650,
    bathroom: 3,
    bedrooms: 3,
    bathroomsAirbnb: 3,
    areaType: 'Carpet Area',
    furnishingStatus: 'Furnished',
    tenantPreferred: 'Family',
    location: {
      address: 'Pali Hill, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      coordinates: { lat: 19.0600, lng: 72.8258 }
    },
    amenities: ['Air Conditioning', 'Club House', 'Swimming Pool', 'Covered Parking', 'Gymnasium', '24/7 Security', 'High Speed Elevators', 'Power Backup'],
    images: ['/datasets-images/image_0.jpg', '/datasets-images/image_1.jpg'],
    predictedRentInfo: {
      predictedRent: 84200,
      lowerBound: 76000,
      upperBound: 92000,
      confidenceLevel: '95%'
    },
    status: 'available'
  },
  {
    title: 'Spacious 2 BHK Gated Community Flat in Indiranagar',
    description: 'Charming and peaceful 2 BHK residence located in the heart of Indiranagar, Bangalore. Close to major IT hubs, metro stations, 100ft road cafes, and prestigious schools. Includes reserved parking and solar water heating.',
    price: 38000,
    listingType: 'Rent',
    propertyType: 'Apartment',
    roomType: 'Entire home/apt',
    bhk: 2,
    size: 1200,
    bathroom: 2,
    bedrooms: 2,
    bathroomsAirbnb: 2,
    areaType: 'Super Area',
    furnishingStatus: 'Semi-Furnished',
    tenantPreferred: 'Anyone',
    location: {
      address: '12th Main Road, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      coordinates: { lat: 12.9784, lng: 77.6408 }
    },
    amenities: ['Power Backup', '24/7 Security', 'Children Play Area', 'Gated Community', 'Balcony', 'Covered Parking'],
    images: ['/datasets-images/image_10.jpg', '/datasets-images/image_11.jpg'],
    predictedRentInfo: {
      predictedRent: 37500,
      lowerBound: 33000,
      upperBound: 42000,
      confidenceLevel: '95%'
    },
    status: 'available'
  },
  {
    title: 'Modern 3 BHK Independent Villa in Jubilee Hills',
    description: 'Palatial 3 BHK private villa in upscale Jubilee Hills, Hyderabad. Features private terrace garden, marble floors, servant quarters, home theatre room, and state-of-the-art security systems.',
    price: 65000,
    listingType: 'Rent',
    propertyType: 'Villa',
    roomType: 'Entire home/apt',
    bhk: 3,
    size: 2400,
    bathroom: 3,
    bedrooms: 3,
    bathroomsAirbnb: 3,
    areaType: 'Carpet Area',
    furnishingStatus: 'Furnished',
    tenantPreferred: 'Family',
    location: {
      address: 'Road No 36, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      coordinates: { lat: 17.4326, lng: 78.4071 }
    },
    amenities: ['Private Garden', 'Security Guard', 'Covered Parking', 'Modular Kitchen', 'Power Backup', 'Air Conditioning'],
    images: ['/datasets-images/image_21.jpg', '/datasets-images/image_22.jpg'],
    predictedRentInfo: {
      predictedRent: 63800,
      lowerBound: 57000,
      upperBound: 71000,
      confidenceLevel: '95%'
    },
    status: 'available'
  },
  {
    title: 'Affordable 1 BHK Studio Apartment in Saket',
    description: 'Compact, cozy and fully functional 1 BHK apartment situated near Saket Metro Station, South Delhi. Ideal for working professionals and students looking for quick transit and lively surroundings.',
    price: 18500,
    listingType: 'Rent',
    propertyType: 'Apartment',
    roomType: 'Entire home/apt',
    bhk: 1,
    size: 550,
    bathroom: 1,
    bedrooms: 1,
    bathroomsAirbnb: 1,
    areaType: 'Super Area',
    furnishingStatus: 'Furnished',
    tenantPreferred: 'Bachelors',
    location: {
      address: 'Block J, Saket',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110017',
      coordinates: { lat: 28.5244, lng: 77.2066 }
    },
    amenities: ['Metro Proximity', 'Wifi Included', 'Power Backup', 'Air Conditioning', 'Water Purifier'],
    images: ['/datasets-images/image_31.jpg', '/datasets-images/image_32.jpg'],
    predictedRentInfo: {
      predictedRent: 18200,
      lowerBound: 15500,
      upperBound: 21000,
      confidenceLevel: '95%'
    },
    status: 'available'
  },
  {
    title: 'Serene 2 BHK Flat near Salt Lake Sector V',
    description: 'Well-ventilated 2 BHK apartment near Salt Lake Sector 2 / IT corridor, Kolkata. Features open balcony overlooking green parks, round the clock water supply, lift facility, and nearby daily markets.',
    price: 20000,
    listingType: 'Rent',
    propertyType: 'Apartment',
    roomType: 'Entire home/apt',
    bhk: 2,
    size: 980,
    bathroom: 2,
    bedrooms: 2,
    bathroomsAirbnb: 2,
    areaType: 'Super Area',
    furnishingStatus: 'Semi-Furnished',
    tenantPreferred: 'Anyone',
    location: {
      address: 'Sector 2, Salt Lake City',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091',
      coordinates: { lat: 22.5867, lng: 88.4178 }
    },
    amenities: ['Lift', '24/7 Security', 'Balcony', 'Intercom', 'Power Backup'],
    images: ['/datasets-images/image_41.jpg', '/datasets-images/image_42.jpg'],
    predictedRentInfo: {
      predictedRent: 19800,
      lowerBound: 16800,
      upperBound: 22800,
      confidenceLevel: '95%'
    },
    status: 'available'
  },
  {
    title: 'Premium 3 BHK Beachside Residence in ECR',
    description: 'Expansive 3 BHK coastal property located on East Coast Road (ECR), Chennai. Enjoy calming ocean breezes, private swimming pool access, landscaped walking pathways, and seamless connectivity to OMR tech corridor.',
    price: 45000,
    listingType: 'Rent',
    propertyType: 'Condominium',
    roomType: 'Entire home/apt',
    bhk: 3,
    size: 1800,
    bathroom: 3,
    bedrooms: 3,
    bathroomsAirbnb: 3,
    areaType: 'Carpet Area',
    furnishingStatus: 'Furnished',
    tenantPreferred: 'Family',
    location: {
      address: 'East Coast Road, Thiruvanmiyur',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600041',
      coordinates: { lat: 12.9830, lng: 80.2594 }
    },
    amenities: ['Sea Breeze Balcony', 'Swimming Pool', 'Gymnasium', '24/7 Security', 'Club House', 'Covered Parking'],
    images: ['/datasets-images/image_51.jpg', '/datasets-images/image_52.jpg'],
    predictedRentInfo: {
      predictedRent: 44500,
      lowerBound: 39000,
      upperBound: 50000,
      confidenceLevel: '95%'
    },
    status: 'available'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rental_management_db');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Property.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Wishlist.deleteMany();
    await Notification.deleteMany();

    console.log('Existing collections cleared.');

    // Create Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@rental.com',
      password: 'adminpassword123',
      role: 'admin',
      phone: '+91 9876543210'
    });

    const owner = await User.create({
      name: 'Rahul Sharma (Property Owner)',
      email: 'owner@rental.com',
      password: 'ownerpassword123',
      role: 'owner',
      phone: '+91 9820011223'
    });

    const tenant = await User.create({
      name: 'Priya Patel (Tenant)',
      email: 'tenant@rental.com',
      password: 'tenantpassword123',
      role: 'tenant',
      phone: '+91 9811223344'
    });

    console.log('Seed users created:');
    console.log(' - Admin: admin@rental.com / adminpassword123');
    console.log(' - Owner: owner@rental.com / ownerpassword123');
    console.log(' - Tenant: tenant@rental.com / tenantpassword123');

    // Create Properties
    for (const prop of sampleProperties) {
      prop.owner = owner._id;
      const createdProp = await Property.create(prop);

      // Add a sample review
      await Review.create({
        property: createdProp._id,
        user: tenant._id,
        rating: 5,
        comment: 'Excellent property! The locality is very peaceful, amenities match the description exactly.'
      });
    }

    console.log(`Seeded ${sampleProperties.length} realistic properties with reviews.`);

    // Initialize Tenant Wishlist with first property
    const firstProp = await Property.findOne();
    if (firstProp) {
      await Wishlist.create({
        user: tenant._id,
        properties: [firstProp._id]
      });
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
}

seed();
