const Property = require('../models/Property');
const User = require('../models/User');

// Supported Indian cities & states
const SUPPORTED_INDIAN_CITIES = [
  'Mangalore',
  'Bangalore',
  'Mysore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Pune'
];

const SUPPORTED_INDIAN_STATES = [
  'Karnataka',
  'Maharashtra',
  'Delhi',
  'Telangana',
  'Tamil Nadu'
];

// Supported USA cities & states (Austin & Asheville benchmark datasets)
const SUPPORTED_USA_CITIES = [
  'Austin',
  'Downtown Austin',
  'South Congress',
  'East Austin',
  'The Domain',
  'Zilker',
  'UT Austin / Campus',
  'Asheville',
  'New York',
  'San Francisco',
  'Los Angeles',
  'Chicago',
  'Seattle',
  'Boston'
];

const SUPPORTED_USA_STATES = [
  'Texas',
  'North Carolina',
  'New York',
  'California',
  'Illinois',
  'Washington',
  'Massachusetts'
];

// @desc    Get all properties with filtering, search and pagination
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res) => {
  try {
    const {
      search,
      city,
      state,
      neighborhood,
      bhk,
      bedrooms,
      roomType,
      minPrice,
      maxPrice,
      propertyType,
      furnishingStatus,
      tenantPreferred,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = { status: 'available' };

    // Search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } },
        { 'location.pincode': { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (city && city !== 'All') query['location.city'] = new RegExp(`^${city}$`, 'i');
    if (state && state !== 'All') query['location.state'] = new RegExp(`^${state}$`, 'i');
    if (neighborhood && neighborhood !== 'All') query['location.neighborhood'] = new RegExp(neighborhood, 'i');
    const bedVal = bhk || bedrooms;
    if (bedVal && bedVal !== 'All') {
      const bedNum = Number(bedVal);
      if (bedNum >= 4) {
        query.$or = [{ bhk: { $gte: 4 } }, { bedrooms: { $gte: 4 } }];
      } else {
        query.$or = [{ bhk: bedNum }, { bedrooms: bedNum }];
      }
    }
    if (propertyType && propertyType !== 'All') query.propertyType = propertyType;
    if (roomType && roomType !== 'All') query.roomType = roomType;
    if (furnishingStatus && furnishingStatus !== 'All') query.furnishingStatus = furnishingStatus;
    if (tenantPreferred && tenantPreferred !== 'All') query.tenantPreferred = tenantPreferred;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'size_desc') sortOption = { size: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Property.countDocuments(query);
    const properties = await Property.find(query)
      .populate('owner', 'name email phone avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching properties'
    });
  }
};

// @desc    Get single property details
// @route   GET /api/properties/:id
// @access  Public
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone avatar');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Increment views count
    property.viewsCount = (property.viewsCount || 0) + 1;
    await property.save();

    res.status(200).json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching property details'
    });
  }
};

// @desc    Create new property listing (Owner only)
// @route   POST /api/properties
// @access  Private (Owner / Admin)
exports.createProperty = async (req, res) => {
  try {
    const propertyData = { ...req.body };
    propertyData.owner = req.user.id;

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      propertyData.images = req.files.map(file => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        if (file.secure_url) {
          return file.secure_url;
        }
        return `/uploads/${file.filename}`;
      });
    } else if (typeof propertyData.images === 'string') {
      try {
        propertyData.images = JSON.parse(propertyData.images);
      } catch (e) {
        propertyData.images = [propertyData.images];
      }
    }

    // Parse location if stringified JSON
    if (typeof propertyData.location === 'string') {
      try {
        propertyData.location = JSON.parse(propertyData.location);
      } catch (e) {}
    }
    if (propertyData.location && !propertyData.location.country) {
      const c = propertyData.location.city;
      propertyData.location.country = SUPPORTED_USA_CITIES.includes(c) ? 'USA' : 'India';
    }

    // Parse amenities if stringified JSON
    if (typeof propertyData.amenities === 'string') {
      try {
        propertyData.amenities = JSON.parse(propertyData.amenities);
      } catch (e) {
        propertyData.amenities = propertyData.amenities.split(',').map(a => a.trim());
      }
    }

    // Parse predictedRentInfo if stringified JSON
    if (typeof propertyData.predictedRentInfo === 'string') {
      try {
        propertyData.predictedRentInfo = JSON.parse(propertyData.predictedRentInfo);
      } catch (e) {}
    }

    const property = await Property.create(propertyData);

    res.status(201).json({
      success: true,
      message: 'Property listed successfully',
      property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating property listing'
    });
  }
};

// @desc    Update property listing
// @route   PUT /api/properties/:id
// @access  Private (Owner / Admin)
exports.updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Ensure owner is modifying their own property (or admin)
    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

    const updateData = { ...req.body };

    // Append new uploaded images if provided
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        if (file.secure_url) {
          return file.secure_url;
        }
        return `/uploads/${file.filename}`;
      });
      updateData.images = [...(property.images || []), ...newImages];
    }

    if (typeof updateData.location === 'string') {
      try { updateData.location = JSON.parse(updateData.location); } catch (e) {}
    }
    if (updateData.location && typeof updateData.location === 'object') {
      const existingLoc = property.location?.toObject ? property.location.toObject() : (property.location || {});
      const city = updateData.location.city || existingLoc.city;
      const defaultCountry = SUPPORTED_USA_CITIES.includes(city) ? 'USA' : 'India';
      updateData.location = {
        ...existingLoc,
        ...updateData.location,
        country: updateData.location.country || existingLoc.country || defaultCountry,
        coordinates: {
          ...(existingLoc.coordinates || {}),
          ...(updateData.location.coordinates || {})
        }
      };
    }
    if (typeof updateData.amenities === 'string') {
      try { updateData.amenities = JSON.parse(updateData.amenities); } catch (e) {}
    }

    property = await Property.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating property'
    });
  }
};

// @desc    Delete property listing
// @route   DELETE /api/properties/:id
// @access  Private (Owner / Admin)
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing'
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting property'
    });
  }
};

// @desc    Get current owner's properties
// @route   GET /api/properties/my-listings
// @access  Private (Owner)
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your listings'
    });
  }
};

// @desc    Get dynamic distinct filter options from available properties
// @route   GET /api/properties/filters
// @access  Public
exports.getPropertyFilters = async (req, res) => {
  try {
    const dbCities = await Property.distinct('location.city', { status: 'available' });
    const dbStates = await Property.distinct('location.state', { status: 'available' });
    const neighborhoods = await Property.distinct('location.neighborhood', { status: 'available' });
    const propertyTypes = await Property.distinct('propertyType', { status: 'available' });
    const roomTypes = await Property.distinct('roomType', { status: 'available' });

    // Merge supported Indian & USA benchmark cities with existing database cities
    const cities = Array.from(new Set([...SUPPORTED_INDIAN_CITIES, ...SUPPORTED_USA_CITIES, ...dbCities.filter(Boolean)])).sort();
    const states = Array.from(new Set([...SUPPORTED_INDIAN_STATES, ...SUPPORTED_USA_STATES, ...dbStates.filter(Boolean)])).sort();

    res.status(200).json({
      success: true,
      cities,
      states,
      neighborhoods: neighborhoods.filter(Boolean).sort(),
      propertyTypes: propertyTypes.filter(Boolean).sort(),
      roomTypes: roomTypes.filter(Boolean).sort()
    });
  } catch (error) {
    console.error('Error fetching property filters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property filters',
      error: error.message
    });
  }
};
