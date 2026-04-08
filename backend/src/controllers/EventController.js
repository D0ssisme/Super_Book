import {
  createEventService,
  getAllEventsService,
  getEventByIdService,
  updateEventService,
  deleteEventService,
  getActiveEventsService,
  updateEventStatusService
} from '../services/EventService.js';

export const createEvent = async (req, res) => {
  try {
    const { name, description, discountPercent, startDate, endDate, applyType, bookIds, categoryIds } = req.body;
    const event = await createEventService({
      name,
      description,
      discountPercent,
      startDate,
      endDate,
      applyType,
      bookIds,
      categoryIds
    });
    res.status(201).json({
      message: 'Tạo sự kiện thành công',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Lỗi tạo sự kiện'
    });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await getAllEventsService(req.query);
    res.status(200).json({
      message: 'Lấy danh sách sự kiện thành công',
      data: events
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách'
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await getEventByIdService(id);
    if (!event) {
      return res.status(404).json({
        message: 'Sự kiện không tồn tại'
      });
    }
    res.status(200).json({
      message: 'Lấy sự kiện thành công',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Lỗi lấy sự kiện'
    });
  }
};

export const getActiveEvents = async (req, res) => {
  try {
    const events = await getActiveEventsService();
    res.status(200).json({
      message: 'Lấy sự kiện đang hoạt động thành công',
      data: events
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Lỗi lấy sự kiện'
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, discountPercent, startDate, endDate, applyType, bookIds, categoryIds } = req.body;
    const event = await updateEventService(id, {
      name,
      description,
      discountPercent,
      startDate,
      endDate,
      applyType,
      bookIds,
      categoryIds
    });
    res.status(200).json({
      message: 'Cập nhật sự kiện thành công',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Lỗi cập nhật sự kiện'
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteEventService(id);
    res.status(200).json({
      message: 'Xóa sự kiện thành công'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Lỗi xóa sự kiện'
    });
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const event = await updateEventStatusService(id, status);
    res.status(200).json({
      message: 'Cập nhật trạng thái sự kiện thành công',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Lỗi cập nhật trạng thái'
    });
  }
};
