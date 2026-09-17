from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    tour_api_service_key: str = ""
    # KorService2 베이스 (문서·미리보기가 *2 인 경우)
    tour_api_kor_service_base: str = "https://apis.data.go.kr/B551011/KorService2"
    tour_api_mobile_app: str = "StoryRoute"
    tour_api_mobile_os: str = "WEB"
    tour_api_daily_limit: int = 900
    # 별도 관광 서비스의 인증키와 공식 서버 주소
    photo_api_service_key: str = ""
    photo_api_base_url: str = "https://apis.data.go.kr/B551011/PhotoGalleryService1"
    audio_api_service_key: str = ""
    audio_api_base_url: str = "https://apis.data.go.kr/B551011/Odii"
    related_api_service_key: str = ""
    related_api_base_url: str = "https://apis.data.go.kr/B551011/TarRlteTarService1"
    access_api_service_key: str = ""
    access_api_base_url: str = "https://apis.data.go.kr/B551011/KorWithService2"
    # 공식 제공 기간에서 실제 조회를 확인한 기준월
    related_api_base_month: str = "202504"
    openai_api_key: str = ""
    openai_model: str = ""

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5173"
    kakao_rest_api_key: str = ""
    route_api_daily_limit: int = 100
    kakao_client_secret: str = ""
    kakao_redirect_uri: str = "http://127.0.0.1:8000/api/v1/auth/kakao/callback"
    kakao_logout_redirect_uri: str = "http://127.0.0.1:3000"
    auth_frontend_success_url: str = "http://127.0.0.1:3000/auth/callback?status=success"
    auth_frontend_failure_url: str = "http://127.0.0.1:3000/auth/callback?status=error"
    auth_jwt_secret: str = ""
    auth_access_token_ttl_seconds: int = 900
    auth_refresh_token_ttl_seconds: int = 1209600
    auth_secure_cookies: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
