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
    title: 'Historic Downtown Loft with Blue Ridge Mountain Views',
    description: 'Stunning luxury loft located in the historic core of Downtown Asheville, NC. Features exposed brick walls, 14ft timber ceilings, custom chef kitchen, spa bathroom, and panoramic sunset views over the Blue Ridge Mountains. Steps from renowned restaurants and craft breweries.',
    price: 245,
    listingType: 'Rent',
    propertyType: 'Entire rental unit',
    roomType: 'Entire home/apt',
    accommodates: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2.0,
    bhk: 2,
    size: 1250,
    minNights: 2,
    isSuperhost: true,
    location: {
      address: 'Pack Square, Downtown Asheville',
      city: 'Asheville',
      neighborhood: 'Downtown',
      state: 'North Carolina',
      pincode: '28801',
      coordinates: { lat: 35.5951, lng: -82.5515 }
    },
    amenities: ['High Speed Wifi', 'Central AC', 'Mountain Views', 'Dedicated Parking', 'Washer/Dryer', 'Self Check-in', 'Chef Kitchen', 'EV Charger'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'],
    predictedRentInfo: {
      predictedRent: 238,
      lowerBound: 100,
      upperBound: 565,
      confidenceLevel: '95% Prediction Interval',
      empiricalCoverage: '93.70%'
    },
    status: 'available'
  },
  {
    title: 'Charming Montford Craftsman Bungalow & Garden Patio',
    description: 'Peaceful and historic Craftsman bungalow situated in the coveted Montford Historic District of Asheville. Features wrap-around rocking chair porch, hardwood floors, native stone fireplace, private fenced garden patio, and walkable access to Riverside Arts District.',
    price: 185,
    listingType: 'Rent',
    propertyType: 'Entire home',
    roomType: 'Entire home/apt',
    accommodates: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2.0,
    bhk: 3,
    size: 1750,
    minNights: 2,
    isSuperhost: true,
    location: {
      address: 'Montford Ave, Montford Historic District',
      city: 'Asheville',
      neighborhood: 'Montford',
      state: 'North Carolina',
      pincode: '28801',
      coordinates: { lat: 35.6025, lng: -82.5630 }
    },
    amenities: ['Fast Wifi', 'Indoor Fireplace', 'Private Garden', 'Free Parking', 'Pet Friendly', 'Kitchen', 'Outdoor Dining', 'Coffee Maker'],
    images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80'],
    predictedRentInfo: {
      predictedRent: 179,
      lowerBound: 75,
      upperBound: 425,
      confidenceLevel: '95% Prediction Interval',
      empiricalCoverage: '93.70%'
    },
    status: 'available'
  },
  {
    title: 'Luxury Biltmore Forest Estate with Private Hot Tub',
    description: 'Exclusive private estate retreat near Biltmore Village, Asheville. Designed with vaulted beamed ceilings, stone master fireplace, gourmet kitchen, outdoor pavilion with fire pit and year-round private cedar hot tub surrounded by tranquil hardwood forest.',
    price: 395,
    listingType: 'Rent',
    propertyType: 'Entire home',
    roomType: 'Entire home/apt',
    accommodates: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3.5,
    bhk: 4,
    size: 3200,
    minNights: 3,
    isSuperhost: true,
    location: {
      address: 'Vanderbilt Rd, Biltmore Forest',
      city: 'Asheville',
      neighborhood: 'Biltmore Village',
      state: 'North Carolina',
      pincode: '28803',
      coordinates: { lat: 35.5682, lng: -82.5427 }
    },
    amenities: ['Hot Tub', 'Fire Pit', 'Mountain Views', 'Smart Home System', 'Garage Parking', 'Game Room', 'BBQ Grill', 'Security System'],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80'],
    predictedRentInfo: {
      predictedRent: 388,
      lowerBound: 163,
      upperBound: 920,
      confidenceLevel: '95% Prediction Interval',
      empiricalCoverage: '93.70%'
    },
    status: 'available'
  },
  {
    title: 'Cozy West Asheville Guest Suite near Haywood Road',
    description: 'Modern, light-filled private guest suite in vibrant West Asheville. Private keyed entrance, organic memory foam queen bed, modern bathroom with rainfall shower, kitchenette, and short walk to Haywood Road bakeries, record stores, and music venues.',
    price: 95,
    listingType: 'Rent',
    propertyType: 'Entire guest suite',
    roomType: 'Entire home/apt',
    accommodates: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1.0,
    bhk: 1,
    size: 550,
    minNights: 1,
    isSuperhost: false,
    location: {
      address: 'Haywood Rd, West Asheville',
      city: 'Asheville',
      neighborhood: 'West Asheville',
      state: 'North Carolina',
      pincode: '28806',
      coordinates: { lat: 35.5785, lng: -82.5930 }
    },
    amenities: ['Wifi', 'Dedicated Workspace', 'Free Street Parking', 'Self Check-in', 'Kitchenette', 'Mini Fridge', 'Microwave', 'Air Conditioning'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80'],
    predictedRentInfo: {
      predictedRent: 98,
      lowerBound: 41,
      upperBound: 232,
      confidenceLevel: '95% Prediction Interval',
      empiricalCoverage: '93.70%'
    },
    status: 'available'
  },
  {
    title: 'Artist Studio Loft in River Arts District (RAD)',
    description: 'Eclectic open-concept studio in the historic River Arts District along the French Broad River. Flooded with natural daylight, industrial high ceilings, original polished concrete floors, custom local pottery, and walkability to artisan workshops and greenway paths.',
    price: 120,
    listingType: 'Rent',
    propertyType: 'Entire rental unit',
    roomType: 'Entire home/apt',
    accommodates: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1.0,
    bhk: 1,
    size: 700,
    minNights: 2,
    isSuperhost: true,
    location: {
      address: 'Roberts St, River Arts District',
      city: 'Asheville',
      neighborhood: 'River Arts District',
      state: 'North Carolina',
      pincode: '28801',
      coordinates: { lat: 35.5862, lng: -82.5658 }
    },
    amenities: ['High Speed Wifi', 'River Views', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Artisan Coffee Bar', 'Smart TV', 'Self Check-in'],
    images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&auto=format&fit=crop&q=80'],
    predictedRentInfo: {
      predictedRent: 125,
      lowerBound: 53,
      upperBound: 297,
      confidenceLevel: '95% Prediction Interval',
      empiricalCoverage: '93.70%'
    },
    status: 'available'
  },
  {
    title: 'Grove Park Scenic Retreat with Fireplace & Deck',
    description: 'Charming mountain haven in prestigious North Asheville / Grove Park neighborhood. Enjoy a morning espresso on the private forest-view deck or cozy up by the stone fireplace after exploring the Blue Ridge Parkway trails.',
    price: 210,
    listingType: 'Rent',
    propertyType: 'Entire home',
    roomType: 'Entire home/apt',
    accommodates: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2.0,
    bhk: 2,
    size: 1400,
    minNights: 2,
    isSuperhost: true,
    location: {
      address: 'Macon Ave, Grove Park',
      city: 'Asheville',
      neighborhood: 'Grove Park',
      state: 'North Carolina',
      pincode: '28804',
      coordinates: { lat: 35.6190, lng: -82.5440 }
    },
    amenities: ['Mountain Views', 'Stone Fireplace', 'Large Deck', 'Covered Parking', 'High Speed Wifi', 'Full Kitchen', 'Washer/Dryer', 'Keyless Entry'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80'],
    predictedRentInfo: {
      predictedRent: 205,
      lowerBound: 86,
      upperBound: 486,
      confidenceLevel: '95% Prediction Interval',
      empiricalCoverage: '93.70%'
    },
    status: 'available'
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rental_system_db';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing
    await User.deleteMany();
    await Property.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Wishlist.deleteMany();
    await Notification.deleteMany();
    console.log('Cleared existing collections.');

    // Create demo users
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@rental.com',
      password: 'Password@123',
      role: 'admin',
      phone: '+1 (828) 555-0199',
      isVerified: true
    });

    const ownerUser = await User.create({
      name: 'Sarah Jenkins (Owner)',
      email: 'owner@rental.com',
      password: 'Password@123',
      role: 'owner',
      phone: '+1 (828) 555-0144',
      isVerified: true
    });

    const tenantUser = await User.create({
      name: 'Alex Rivera (Guest)',
      email: 'tenant@rental.com',
      password: 'Password@123',
      role: 'tenant',
      phone: '+1 (828) 555-0177',
      isVerified: true
    });

    console.log('Created Demo Accounts:');
    console.log('  Admin : admin@rental.com  / Password@123');
    console.log('  Owner : owner@rental.com  / Password@123');
    console.log('  Tenant: tenant@rental.com / Password@123');

    // Create properties assigned to owner
    const createdProperties = [];
    for (const prop of sampleProperties) {
      prop.owner = ownerUser._id;
      const created = await Property.create(prop);
      createdProperties.push(created);
    }
    console.log(`Seeded ${createdProperties.length} Asheville V3 benchmark properties.`);

    // Create sample bookings
    await Booking.create({
      property: createdProperties[0]._id,
      tenant: tenantUser._id,
      owner: ownerUser._id,
      checkInDate: new Date(Date.now() + 86400000 * 5),
      checkOutDate: new Date(Date.now() + 86400000 * 9),
      totalAmount: createdProperties[0].price * 4,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    // Create sample review
    await Review.create({
      property: createdProperties[0]._id,
      tenant: tenantUser._id,
      rating: 5,
      comment: 'Breathtaking mountain views and impeccable hospitality! The loft was spotless and accurately matched the AI pricing valuation.'
    });

    console.log('Seeded initial bookings, reviews, and notifications.');
    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = { sampleProperties, seedDB };
