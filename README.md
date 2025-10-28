# Philadelphia Transit Index Dashboard

An interactive web dashboard that helps housing seekers and tenants in Philadelphia evaluate neighborhoods based on transit accessibility. The dashboard calculates a transit index at the census tract level through spatial analysis and provides a breakdown of key factors that influence transit access.

## Purpose

**Key Question:** *Where can I find a place to live that fits my transit needs or desires?*

This dashboard empowers housing seekers and tenants to make informed decisions about where to live in Philadelphia by providing clear, visual insights into transit accessibility across different neighborhoods. Whether you prioritize proximity to subway stations, bus routes, or regional rail, this tool helps you understand the transit landscape of Philadelphia.

## Target Audience

- **Housing Seekers**: Individuals looking for a new place to live who want to prioritize transit access
- **Current Tenants**: Residents evaluating their current location or considering a move
- **Urban Planners**: Professionals analyzing transit accessibility patterns
- **Real Estate Professionals**: Agents helping clients find transit-accessible housing

## Features

- **Interactive Map**: Explore Philadelphia neighborhoods with an intuitive map interface powered by Mapbox
- **Transit Index Visualization**: View transit accessibility scores at the census tract level
- **Index Breakdown**: Understand the key factors that contribute to each area's transit score
- **Geographic Search**: Find specific neighborhoods or addresses
- **Data-Driven Insights**: Make informed housing decisions based on comprehensive transit analysis

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Mapbox GL JS v3.15.0
- **Data Analysis**: Census tract level spatial analysis
- **Code Quality**: ESLint, Stylelint
- **License**: MIT

## Installation

### Prerequisites

- Node.js (v14 or higher recommended)
- npm (Node Package Manager)
- A Mapbox API token (get one free at [mapbox.com](https://www.mapbox.com/))

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/zyang91/transit-index-dashboard.git
   cd transit-index-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your Mapbox token:
   - Create a `.env` file or directly add your token to the JavaScript configuration
   - Add your Mapbox access token where required in the code

4. Open `index.html` in a web browser or use a local development server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js http-server (install with: npm install -g http-server)
   http-server
   ```

5. Navigate to `http://localhost:8000` in your browser

## Usage

1. **Explore the Map**: The dashboard opens with an interactive map of Philadelphia
2. **View Transit Index**: Census tracts are colored based on their transit accessibility score
3. **Click for Details**: Click on any census tract to see detailed information about:
   - Overall transit index score
   - Proximity to subway/metro stations
   - Bus route accessibility
   - Regional rail access
   - Other contributing factors
4. **Search Locations**: Use the search feature to find specific neighborhoods or addresses
5. **Compare Areas**: Click between different census tracts to compare transit accessibility

## Project Structure

```
transit-index-dashboard/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Stylesheet for the dashboard
├── js/
│   ├── index.js           # Main JavaScript entry point
│   ├── map.js             # Map initialization and configuration
│   ├── chart.js           # Data visualization components
│   └── geolocate.js       # Geolocation functionality
├── package.json           # Project dependencies and scripts
├── .eslintrc.json        # ESLint configuration
├── .stylelintrc.json     # Stylelint configuration
├── LICENSE               # MIT License
└── README.md             # This file
```

## Data Sources

The transit index is calculated using the following data sources:

- **Census Tract Boundaries**: U.S. Census Bureau TIGER/Line Shapefiles
- **SEPTA Transit Data**: Southeastern Pennsylvania Transportation Authority
  - Subway/Metro lines and stations
  - Bus routes and stops
  - Regional rail stations
- **Philadelphia Open Data**: Additional geographic and demographic data

*Note: All data sources will be properly cited in the dashboard interface.*

## Development

### Linting

Run code quality checks before committing:

```bash
# Check JavaScript code
npm run js-lint

# Check CSS code
npm run css-lint
```

### Code Style

- JavaScript: Follows Google JavaScript Style Guide
- CSS: Follows standard CSS conventions
- Use meaningful variable and function names
- Comment complex logic
- Keep functions small and focused

## Transit Index Methodology

The transit index is calculated based on:

1. **Proximity to Transit Stops**: Distance to nearest subway, bus, and rail stations
2. **Frequency of Service**: Number of routes and service frequency
3. **Coverage**: Percentage of census tract within walkable distance to transit
4. **Transit Type Weighting**: Different weights for subway, bus, and regional rail
5. **Accessibility**: ADA accessibility and infrastructure quality

*Detailed methodology documentation will be provided in the dashboard.*

## Contributing

This project was developed as part of the MUSA (Master of Urban Spatial Analytics) JavaScript course. Contributions, suggestions, and feedback are welcome!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Zhanchao Yang

## Author

**Zhanchao Yang**
- GitHub: [@zyang91](https://github.com/zyang91)
- Project: MUSA JavaScript Dashboard

## Acknowledgments

- Weitzman School of Design, University of Pennsylvania
- MUSA JavaScript Course
- Mapbox for mapping services
- SEPTA for transit data
- U.S. Census Bureau for geographic data

## Future Enhancements

Potential features for future development:

- [ ] Real-time transit updates
- [ ] Historical transit data trends
- [ ] Integration with housing price data
- [ ] Walkability scores
- [ ] Bike infrastructure overlay
- [ ] Customizable index weighting based on user preferences
- [ ] Mobile-responsive design improvements
- [ ] Multi-language support

## Support

For questions, issues, or suggestions, please open an issue on the [GitHub repository](https://github.com/zyang91/transit-index-dashboard/issues).
