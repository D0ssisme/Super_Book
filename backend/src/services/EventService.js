import Event from '../models/Event.js';
import EventBook from '../models/EventBook.js';
import Book from '../models/Book.js';

// Create event
export async function createEventService(eventData) {
  try {
    const { name, description, discountPercent, startDate, endDate, applyType, bookIds, categoryIds } = eventData;
    
    if (!name || !discountPercent || !startDate || !endDate || !applyType) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    // Validate applyType
    if (!['all', 'products', 'categories'].includes(applyType)) {
      throw new Error('ApplyType không hợp lệ');
    }

    const eventPayload = {
      name,
      description,
      discountPercent,
      startDate,
      endDate,
      applyType,
      status: 'upcoming'
    };

    // Add bookIds or categoryIds based on applyType
    if (applyType === 'products' && bookIds && Array.isArray(bookIds)) {
      eventPayload.bookIds = bookIds;
    } else if (applyType === 'categories' && categoryIds && Array.isArray(categoryIds)) {
      eventPayload.categoryIds = categoryIds;
    }

    const newEvent = await Event.create(eventPayload);

    return newEvent;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Get all events
export async function getAllEventsService(query = {}) {
  try {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Event.countDocuments();

    return {
      events,
      totalEvents: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

// Get event by ID
export async function getEventByIdService(eventId) {
  try {
    const event = await Event.findById(eventId)
      .populate('bookIds', 'name price imageUrl')
      .populate('categoryIds', 'name');
    
    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Update event
export async function updateEventService(eventId, eventData) {
  try {
    const { applyType, bookIds, categoryIds, ...otherData } = eventData;
    
    const updatePayload = { ...otherData, updatedAt: Date.now() };

    if (applyType) {
      if (!['all', 'products', 'categories'].includes(applyType)) {
        throw new Error('ApplyType không hợp lệ');
      }
      updatePayload.applyType = applyType;
      
      // Clear old ids and set new ones based on applyType
      updatePayload.bookIds = [];
      updatePayload.categoryIds = [];
      
      if (applyType === 'products' && bookIds && Array.isArray(bookIds)) {
        updatePayload.bookIds = bookIds;
      } else if (applyType === 'categories' && categoryIds && Array.isArray(categoryIds)) {
        updatePayload.categoryIds = categoryIds;
      }
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      updatePayload,
      { new: true, runValidators: true }
    ).populate('bookIds', 'name price imageUrl')
     .populate('categoryIds', 'name');

    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Delete event
export async function deleteEventService(eventId) {
  try {
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Add books to event
export async function addBooksToEventService(eventId, bookIds) {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event không tồn tại');
    }

    // Validate books exist
    const books = await Book.find({ _id: { $in: bookIds } });
    if (books.length !== bookIds.length) {
      throw new Error('Một số sách không tồn tại');
    }

    // Create EventBook records
    const eventBooks = bookIds.map(bookId => ({
      eventId,
      bookId
    }));

    await EventBook.insertMany(eventBooks, { ordered: false }).catch(err => {
      // Ignore duplicate key errors, continue with others
      if (err.code !== 11000) throw err;
    });

    return { message: 'Thêm sách vào event thành công' };
  } catch (err) {
    throw new Error(err.message);
  }
}

// Remove book from event
export async function removeBookFromEventService(eventId, bookId) {
  try {
    const result = await EventBook.findOneAndDelete({
      eventId,
      bookId
    });

    if (!result) {
      throw new Error('Sách không tồn tại trong event này');
    }

    return { message: 'Xóa sách khỏi event thành công' };
  } catch (err) {
    throw new Error(err.message);
  }
}

// Get active events
export async function getActiveEventsService() {
  try {
    const now = new Date();
    const activeEvents = await Event.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    return activeEvents;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Get event for a specific book
export async function getEventForBookService(bookId) {
  try {
    const now = new Date();
    
    const eventBook = await EventBook.findOne({ bookId }).populate({
      path: 'eventId',
      match: {
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
      }
    });

    if (eventBook && eventBook.eventId) {
      return eventBook.eventId;
    }

    return null;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Update event status (admin only)
export async function updateEventStatusService(eventId, status) {
  try {
    if (!['active', 'inactive', 'upcoming'].includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}
