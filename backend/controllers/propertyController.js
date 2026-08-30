const Property = require('../models/Property');
const User = require('../models/User');

// @desc    Get all properties with filtering, search and pagination
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res) => {
  try {
    const {
      search,
      city,
      bhk,
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
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (city && city !== 'All') query['location.city'] = city;
    if (bhk && bhk !== 'All') query.bhk = Number(bhk);
    if (propertyType && propertyType !== 'All') query.propertyType = propertyType;
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
      propertyData.images = req.files.map(file => `/uploads/${file.filename}`);
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
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      updateData.images = [...(property.images || []), ...newImages];
    }

    if (typeof updateData.location === 'string') {
      try { updateData.location = JSON.parse(updateData.location); } catch (e) {}
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
