# 06. Component Catalog

## 1. Core Search Components
- `SearchHero`
- `QueryComposer`
- `QuickIntentChip`
- `IntentPresetCard`

## 2. Search Result Components
- `FilterSidebar`
- `FilterSection`
- `PlaceCard`
- `ReasonBadgeList`
- `MapPanel`
- `SearchResultEmptyState`

## 3. Place Detail Components
- `PlaceHero`
- `PlaceInfoCard`
- `StoryCard`
- `NearbyPlaceCarousel`
- `ReasonCard`
- `AddToPlannerPanel`

## 4. Planner Components
- `PlannerConstraintForm`
- `PlannerAgentPanel`
- `ItineraryDayTabs`
- `ItineraryDayList`
- `ItineraryStopCard`
- `PlannerMapPanel`
- `ConstraintCheckCard`

## 5. Trips Components
- `TripCard`
- `SavedTripSection`
- `RecentSearchRebuildCard`
- `LikedPlaceGrid`

## 6. Region Components
- `RegionHero`
- `RegionIntentCard`
- `RegionKeyPlaceCard`
- `RegionStorySection`

## 7. Admin Components
- `KPIGrid`
- `IntentTable`
- `PlaceCombinationList`
- `IngestionStatusCard`
- `PlannerFunnelCard`

## 8. Component Rules
- data fetching은 page/container 레벨에서 처리
- presentational component는 API를 직접 모름
- loading / empty / error variant를 component 단위에서 지원
- `PlaceCard`, `ItineraryStopCard`, `StoryCard`는 재사용 가능한 핵심 컴포넌트
