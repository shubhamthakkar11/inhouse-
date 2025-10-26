import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = 'http://localhost:5000/api';

class EventService {
  constructor() {
    this.storageKey = 'smart_event_planner_events';
    this.useBackend = false;
  }

  async checkBackendConnection() {
    try {
      const response = await axios.get(`${API_BASE_URL}/events`, { timeout: 1000 });
      this.useBackend = true;
      return true;
    } catch (error) {
      this.useBackend = false;
      return false;
    }
  }

  async getCurrentUserId() {
    try {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.id;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getAllEvents() {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.get(`${API_BASE_URL}/events`);
        return response.data.data || [];
      } else {
        const eventsJson = localStorage.getItem(this.storageKey);
        return eventsJson ? JSON.parse(eventsJson) : [];
      }
    } catch (error) {
      console.error('Error loading events:', error);
      const eventsJson = localStorage.getItem(this.storageKey);
      return eventsJson ? JSON.parse(eventsJson) : [];
    }
  }

  async getEventById(id) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.get(`${API_BASE_URL}/events/${id}`);
        return response.data.data;
      } else {
        const events = await this.getAllEvents();
        return events.find(event => event.id === id);
      }
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  }

  async createEvent(eventData) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          event_name: eventData.eventName || '',
          event_type: eventData.eventType || '',
          description: eventData.description || '',
          date: eventData.date || null,
          time: eventData.time || null,
          location: eventData.location || '',
          city: eventData.city || '',
          venue_type: eventData.venueType || '',
          audience_size: eventData.audienceSize || 0,
          duration: eventData.duration || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating event in Supabase:', error);
        throw error;
      }

      const events = await this.getAllEvents();
      events.unshift(newEvent);
      localStorage.setItem(this.storageKey, JSON.stringify(events));

      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(id, updates) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.put(`${API_BASE_URL}/events/${id}`, updates);
        const updatedEvent = response.data.data;

        const events = await this.getAllEvents();
        const index = events.findIndex(event => event.id === id);
        if (index !== -1) {
          events[index] = updatedEvent;
          localStorage.setItem(this.storageKey, JSON.stringify(events));
        }

        return updatedEvent;
      } else {
        const events = await this.getAllEvents();
        const index = events.findIndex(event => event.id === id);

        if (index === -1) {
          throw new Error('Event not found');
        }

        events[index] = {
          ...events[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(events));
        return events[index];
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        await axios.delete(`${API_BASE_URL}/events/${id}`);
      }

      const events = await this.getAllEvents();
      const filteredEvents = events.filter(event => event.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredEvents));
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
