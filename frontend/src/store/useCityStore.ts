import { create } from 'zustand';

export interface City {
  id: number;
  name: string;
  slug: string;
}

interface CityState {
  selectedCity: City;
  setSelectedCity: (city: City) => void;
}

const DEFAULT_CITY: City = {
  id: 1,
  name: 'Bengaluru',
  slug: 'bengaluru'
};

const getSavedCity = (): City => {
  const saved = localStorage.getItem('cinecircle_selected_city');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_CITY;
    }
  }
  return DEFAULT_CITY;
};

export const useCityStore = create<CityState>((set) => ({
  selectedCity: getSavedCity(),
  setSelectedCity: (city) => {
    localStorage.setItem('cinecircle_selected_city', JSON.stringify(city));
    set({ selectedCity: city });
  }
}));
