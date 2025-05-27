# WealthMap

A property intelligence platform that turns real estate data into actionable insights. Built for teams who need to understand not just what properties exist, but who owns them and what they're worth.


Team: Cache Me If You Can

Devs: Tania Solanki, Dhruval Padia, Ashish Gattu

Live Link: https://fueledwealthmap.netlify.app

**_PS:_** Current working branch: [`dhruval` (deployed)](https://github.com/dhruval30/fueled-wealth-map/tree/dhruval). Backup branch: [`backup` (contains local stable code)](https://github.com/dhruval30/fueled-wealth-map/tree/backup).

## What it does

- **Property Discovery**: Search by address, zip code, or click anywhere on an interactive map
- **Street View Integration**: Automatically captures property images for visual context
- **AI Wealth Estimation**: Estimates owner net worth using property values, tax data, and regional income patterns
- **Smart Reports**: Generate market analysis, investment summaries, and risk assessments with AI
- **Team Collaboration**: Multi-user companies with role-based permissions

## The Stack

**Backend**: Node.js + Express + MongoDB  
**Frontend**: React + Vite + Tailwind CSS  
**Data**: ATTOM Data API for property information  
**AI**: Groq (Llama 3.3) for wealth analysis and report generation  
**Images**: GridFS for street view storage, Playwright for capture  
**Maps**: Leaflet with OpenStreetMap tiles  

## Quick Start

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend  
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
# Backend (.env)
PORT=
MONGO_URI=
JWT_SECRET=
NODE_ENV=development

MJ_APIKEY_PUBLIC=
MJ_APIKEY_PRIVATE=
MJ_SENDER_EMAIL=

FRONTEND_URL=http://localhost:5173

# Frontend (.env)
VITE_ATTOM_API_KEY=your-attom-api-key
VITE_API_URL=your-backend
```

## Architecture Notes

- **Multi-tenant**: All data is company-scoped for B2B use
- **GridFS**: Street view images stored in MongoDB for scalability
- **AI Pipeline**: Property data → wealth estimation → report generation
- **Search History**: Every interaction is logged for analytics and replayability
- **Role-based Access**: Admin/Analyst/Viewer permissions with invitation system

## Database Schema

8 main collections handling everything from user auth to AI-generated reports. Check the [full schema](https://www.notion.so/WealthMap-Technical-Documentation-1ff747ce31a380c5887ad7fb625f1796) for the nerdy details.


