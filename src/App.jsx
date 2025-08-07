import React, { useState, useEffect, useCallback } from 'react';
import './styles.css'; // Import your global CSS

function App() {
  const [allTimezones, setAllTimezones] = useState([]);
  const [timezoneDisplayNames, setTimezoneDisplayNames] = useState({});
  const [activeTimezones, setActiveTimezones] = useState([]);
  const [is24HourFormat, setIs24HourFormat] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const translations = {
    en: {
      pageTitle: "World Clock Landing Page",
      mainHeading: "World Clock",
      subHeading: "See the time anywhere in the world...",
      searchPlaceholder: "Search timezone...",
      loading: "Loading...",
      noResults: "No results",
      addClock: "Add New Clock",
      converterTitle: "Timezone Converter",
      to: "to",
      convert: "Convert",
      selectToConvert: "Select times and timezones to convert.",
      toggleTheme: "Toggle Theme",
      toggleFormat: "12H / 24H"
    },
    es: {
      pageTitle: "Página de Reloj Mundial",
      mainHeading: "Reloj Mundial",
      subHeading: "Mira la hora de cualquier lugar del mundo...",
      searchPlaceholder: "Buscar zona horaria...",
      loading: "Cargando...",
      noResults: "Sin resultados",
      addClock: "Agregar Nuevo Reloj",
      converterTitle: "Convertidor de Zona Horaria",
      to: "a",
      convert: "Convertir",
      selectToConvert: "Selecciona horas y zonas horarias para convertir.",
      toggleTheme: "Cambiar Tema",
      toggleFormat: "12H / 24H"
    }
  };

  // Fetch timezones from API
  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const response = await fetch('http://worldtimeapi.org/api/timezone');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllTimezones(data);

        const names = {};
        data.forEach(tz => {
          const parts = tz.split('/');
          const cityName = parts[parts.length - 1].replace(/_/g, ' ');
          names[tz] = cityName;
        });
        setTimezoneDisplayNames(names);
        console.log('Timezones fetched and processed.');
      } catch (error) {
        console.error('Could not fetch timezones:', error);
        // Fallback to a few hardcoded timezones if API fails
        const fallbackTimezones = [
          "America/New_York", "Europe/London", "Europe/Paris", "Asia/Tokyo",
          "Australia/Sydney", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore"
        ];
        setAllTimezones(fallbackTimezones);
        const names = {};
        fallbackTimezones.forEach(tz => {
          const parts = tz.split('/');
          const cityName = parts[parts.length - 1].replace(/_/g, ' ');
          names[tz] = cityName;
        });
        setTimezoneDisplayNames(names);
      }
    };
    fetchTimezones();
  }, []);

  // Load saved preferences (language, theme, time format, active timezones)
  useEffect(() => {
    console.log('Loading saved preferences...');
    const savedLang = localStorage.getItem('worldClockLang') || 'en';
    setCurrentLang(savedLang);

    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log('Saved theme from localStorage:', savedTheme);
    setTheme(savedTheme);
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');

    const savedTimeFormat = localStorage.getItem('timeFormat') || '12h';
    setIs24HourFormat(savedTimeFormat === '24h');

    const savedActiveTimezones = localStorage.getItem('activeTimezones');
    if (savedActiveTimezones) {
      setActiveTimezones(JSON.parse(savedActiveTimezones));
    } else {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setActiveTimezones([userTimezone || "America/New_York"]);
    }
  }, []);

  // Save active timezones whenever they change
  useEffect(() => {
    localStorage.setItem('activeTimezones', JSON.stringify(activeTimezones));
  }, [activeTimezones]);

  const handleLanguageChange = useCallback((event) => {
    const newLang = event.target.value;
    setCurrentLang(newLang);
    localStorage.setItem('worldClockLang', newLang);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('Toggling theme to:', newTheme);
      document.body.classList.toggle('dark-theme', newTheme === 'dark');
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  const handleFormatToggle = useCallback(() => {
    setIs24HourFormat(prevFormat => {
      const newFormat = !prevFormat;
      localStorage.setItem('timeFormat', newFormat ? '24h' : '12h');
      return newFormat;
    });
  }, []);

  const addClock = useCallback(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setActiveTimezones(prevTimezones => [...prevTimezones, userTimezone || "America/New_York"]);
  }, []);

  const removeClock = useCallback((indexToRemove) => {
    setActiveTimezones(prevTimezones => prevTimezones.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleTimezoneChange = useCallback((index, newTimezone) => {
    setActiveTimezones(prevTimezones => {
      const updatedTimezones = [...prevTimezones];
      updatedTimezones[index] = newTimezone;
      return updatedTimezones;
    });
  }, []);

  // Component for a single clock display
  const ClockItem = ({ timezone, is24HourFormat, currentLang, timezoneDisplayNames, onTimezoneChange, onRemove }) => {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const [city, setCity] = useState('');
    const hourHandRef = React.useRef(null);
    const minuteHandRef = React.useRef(null);
    const secondHandRef = React.useRef(null);

    useEffect(() => {
      const updateClock = () => {
        const now = new Date();
        const timeOptions = {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: !is24HourFormat
        };
        const dateOptions = {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };

        setTime(now.toLocaleTimeString('en-US', timeOptions));
        setDate(now.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', dateOptions));
        setCity(timezoneDisplayNames[timezone] || timezone.split('/').pop().replace(/_/g, ' '));

        // Analog clock update
        const hours = now.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: timezone });
        const minutes = now.toLocaleTimeString('en-US', { minute: 'numeric', timeZone: timezone });
        const seconds = now.toLocaleTimeString('en-US', { second: 'numeric', timeZone: timezone });

        const secondDegrees = (seconds / 60) * 360;
        const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
        const hourDegrees = ((hours + minutes / 60) / 12) * 360;

        if (secondHandRef.current) secondHandRef.current.style.transform = `rotate(${secondDegrees}deg)`;
        if (minuteHandRef.current) minuteHandRef.current.style.transform = `rotate(${minuteDegrees}deg)`;
        if (hourHandRef.current) hourHandRef.current.style.transform = `rotate(${hourDegrees}deg)`;
      };

      updateClock(); // Initial update
      const interval = setInterval(updateClock, 1000);
      return () => clearInterval(interval); // Cleanup on unmount
    }, [timezone, is24HourFormat, currentLang, timezoneDisplayNames]);

    return (
      <div className="clock-item">
        <div className="clock-header">
          <select
            className="timezone-select-item"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
          >
            {Object.keys(timezoneDisplayNames).sort((a, b) => {
              const nameA = timezoneDisplayNames[a].toLowerCase();
              const nameB = timezoneDisplayNames[b].toLowerCase();
              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            }).map(tz => (
              <option key={tz} value={tz}>{timezoneDisplayNames[tz]}</option>
            ))}
          </select>
          <button className="remove-clock-btn" onClick={onRemove}>X</button>
        </div>
        <div className="clock-display">
          <div className="digital-clock">
            <div className="time">{time}</div>
            <div className="date">{date}</div>
            <div className="city">{city}</div>
          </div>
          <div className="analog-clock">
            <div className="hand hour" ref={hourHandRef}></div>
            <div className="hand minute" ref={minuteHandRef}></div>
            <div className="hand second" ref={secondHandRef}></div>
            <div className="center-dot"></div>
          </div>
        </div>
      </div>
    );
  };

  // Component for Timezone Converter
  const TimezoneConverter = ({ is24HourFormat, currentLang, timezoneDisplayNames }) => {
    const [sourceTime, setSourceTime] = useState('12:00');
    const [sourceTimezone, setSourceTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York");
    const [targetTimezone, setTargetTimezone] = useState("Europe/London");
    const [convertedTime, setConvertedTime] = useState(translations[currentLang].selectToConvert);

    const convertTime = useCallback(() => {
      if (!sourceTime || !sourceTimezone || !targetTimezone) {
        setConvertedTime(translations[currentLang].selectToConvert);
        return;
      }

      const [hours, minutes] = sourceTime.split(':').map(Number);
      const now = new Date();
      now.setHours(hours, minutes, 0, 0);

      const targetTimeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24HourFormat,
        timeZone: targetTimezone
      };

      const targetDateOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: targetTimezone
      };

      const convertedTimeString = now.toLocaleTimeString('en-US', targetTimeOptions);
      const convertedDateString = now.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', targetDateOptions);
      const targetCityName = timezoneDisplayNames[targetTimezone] || targetTimezone.split('/').pop().replace(/_/g, ' ');

      setConvertedTime(`${convertedTimeString} ${convertedDateString} (${targetCityName})`);
    }, [sourceTime, sourceTimezone, targetTimezone, is24HourFormat, currentLang, timezoneDisplayNames, translations]);

    useEffect(() => {
      convertTime(); // Recalculate when dependencies change
    }, [convertTime]);

    return (
      <section className="timezone-converter">
        <h2>{translations[currentLang].converterTitle}</h2>
        <div className="converter-inputs">
          <input type="time" value={sourceTime} onChange={(e) => setSourceTime(e.target.value)} />
          <select value={sourceTimezone} onChange={(e) => setSourceTimezone(e.target.value)}>
            {Object.keys(timezoneDisplayNames).sort((a, b) => {
              const nameA = timezoneDisplayNames[a].toLowerCase();
              const nameB = timezoneDisplayNames[b].toLowerCase();
              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            }).map(tz => (
              <option key={tz} value={tz}>{timezoneDisplayNames[tz]}</option>
            ))}
          </select>
          <span>{translations[currentLang].to}</span>
          <select value={targetTimezone} onChange={(e) => setTargetTimezone(e.target.value)}>
            {Object.keys(timezoneDisplayNames).sort((a, b) => {
              const nameA = timezoneDisplayNames[a].toLowerCase();
              const nameB = timezoneDisplayNames[b].toLowerCase();
              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            }).map(tz => (
              <option key={tz} value={tz}>{timezoneDisplayNames[tz]}</option>
            ))}
          </select>
          <button onClick={convertTime}>{translations[currentLang].convert}</button>
        </div>
        <div className="converter-result">
          <p>{convertedTime}</p>
        </div>
      </section>
    );
  };

  return (
    <div className="container">
      <header>
        <h1>{translations[currentLang].mainHeading}</h1>
        <p>{translations[currentLang].subHeading}</p>
        <div className="language-selector">
          <select id="language-select" value={currentLang} onChange={handleLanguageChange}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div className="settings-controls">
          <button onClick={handleThemeToggle}>{translations[currentLang].toggleTheme}</button>
          <button onClick={handleFormatToggle}>{translations[currentLang].toggleFormat}</button>
        </div>
      </header>

      <main>
        <div id="clocks-container" className="clocks-grid">
          {activeTimezones.map((timezone, index) => (
            <ClockItem
              key={index} // Using index as key is okay for stable lists, but a unique ID would be better if reordering/filtering was common
              timezone={timezone}
              is24HourFormat={is24HourFormat}
              currentLang={currentLang}
              timezoneDisplayNames={timezoneDisplayNames}
              onTimezoneChange={(newTz) => handleTimezoneChange(index, newTz)}
              onRemove={() => removeClock(index)}
            />
          ))}
        </div>

        <button id="add-clock-btn" onClick={addClock}>{translations[currentLang].addClock}</button>
      </main>

      <TimezoneConverter
        is24HourFormat={is24HourFormat}
        currentLang={currentLang}
        timezoneDisplayNames={timezoneDisplayNames}
      />
    </div>
  );
}

export default App;
