import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

const CitiesContext = createContext();
// const URL = "http://localhost:3000";
const URL = "https://worldwise-api-1dc7.onrender.com";

const initialState = {
  cities: [],
  currentCity: {},
  isLoading: false,
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };
    case "cities/loaded":
      return { ...state, cities: action.payload, isLoading: false };
    case "city/loaded":
      return { ...state, isLoading: false, currentCity: action.payload };
    case "city/created":
      return {
        ...state,
        cities: [...state.cities, action.payload],
        isLoading: false,
        currentCity: action.payload,
      };
    case "city/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };
    case "rejected":
      return { ...state, isLoading: false, error: action.payload };
    default:
      throw new Error("Action type not found!");
  }
}

function CitiesProvider({ children }) {
  const [{ cities, currentCity, isLoading }, dispatch] = useReducer(
    reducer,
    initialState
  );

  useEffect(() => {
    async function fetchCities() {
      try {
        dispatch({ type: "loading" });
        const res = await fetch(`${URL}/cities`);
        const data = await res.json();
        dispatch({ type: "cities/loaded", payload: data });
      } catch (e) {
        dispatch({ type: "rejected", payload: e.message });
      }
    }
    fetchCities();
  }, []);

  const getCity = useCallback(
    async function getCity(id) {
      if (Number(id) === currentCity.id) return;
      try {
        dispatch({ type: "loading" });
        const res = await fetch(`${URL}/cities/${id}`);
        const data = await res.json();
        dispatch({ type: "city/loaded", payload: data });
      } catch (e) {
        dispatch({ type: "rejected", payload: e.message });
      }
    },
    [currentCity.id]
  );

  async function createCity(newCity) {
    try {
      dispatch({ type: "loading" });
      const res = await fetch(`${URL}/cities`, {
        method: "POST",
        body: JSON.stringify(newCity),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      dispatch({ type: "city/created", payload: data });
    } catch (e) {
      dispatch({ type: "rejected", payload: e.message });
    }
  }

  async function deleteCity(cityId) {
    try {
      dispatch({ type: "loading" });
      await fetch(`${URL}/cities/${cityId}`, {
        method: "DELETE",
      });
      dispatch({ type: "city/deleted", payload: cityId });
    } catch (e) {
      dispatch({ type: "rejected", payload: e.message });
    }
  }
  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined)
    throw new Error("You cant use context outside context provider!");
  return context;
}

export { CitiesProvider, useCities };
