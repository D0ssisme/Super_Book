import api from "@/lib/axios";

export async function getAllEventsApi() {
  try {
    const response = await api.get(`/events`);
    return response.data.events || [];
  } catch (error) {
    throw error;
  }
}

export async function getActiveEventsApi() {
  try {
    const response = await api.get(`/events/active`);
    return response.data.events || [];
  } catch (error) {
    throw error;
  }
}

export async function getEventByIdApi(eventId: string) {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response.data.event;
  } catch (error) {
    throw error;
  }
}

export async function createEventApi(data: {
  name: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}) {
  try {
    const response = await api.post(`/events`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateEventApi(eventId: string, data: any) {
  try {
    const response = await api.put(`/events/${eventId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteEventApi(eventId: string) {
  try {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function addBooksToEventApi(eventId: string, bookIds: string[]) {
  try {
    const response = await api.post(
      `/events/${eventId}/add-books`,
      { bookIds }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function removeBookFromEventApi(
  eventId: string,
  bookId: string
) {
  try {
    const response = await api.delete(
      `/events/${eventId}/remove-book/${bookId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}
