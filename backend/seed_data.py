import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from models import Content
from datetime import datetime, timezone

load_dotenv()

async def seed_database():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Sample movies and series
    contents = [
        {
            "type": "movie",
            "title": "A Origem",
            "original_title": "Inception",
            "synopsis": "Um ladrão que rouba segredos através do uso da tecnologia de compartilhamento de sonhos.",
            "year": 2010,
            "duration_minutes": 148,
            "genres": ["Ação", "Ficção Científica", "Thriller"],
            "director": "Christopher Nolan",
            "cast": ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
            "rating": "PG-13",
            "poster_url": "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
            "banner_url": "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
            "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            "hls_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            "published": True,
            "featured": True,
            "trending": True,
            "views": 1523
        },
        {
            "type": "movie",
            "title": "Interestelar",
            "original_title": "Interstellar",
            "synopsis": "Uma equipe de exploradores viaja através de um buraco de minhoca no espaço.",
            "year": 2014,
            "duration_minutes": 169,
            "genres": ["Ficção Científica", "Drama", "Aventura"],
            "director": "Christopher Nolan",
            "cast": ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
            "rating": "PG-13",
            "poster_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            "banner_url": "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
            "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            "hls_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            "published": True,
            "featured": True,
            "trending": True,
            "views": 2341
        },
        {
            "type": "movie",
            "title": "Matrix",
            "original_title": "The Matrix",
            "synopsis": "Um hacker descobre a verdadeira natureza de sua realidade.",
            "year": 1999,
            "duration_minutes": 136,
            "genres": ["Ação", "Ficção Científica"],
            "director": "Lana Wachowski",
            "cast": ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
            "rating": "R",
            "poster_url": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            "banner_url": "https://image.tmdb.org/t/p/original/icmmSD4vTTDKOq2vvdulafOGw93.jpg",
            "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            "hls_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            "published": True,
            "trending": True,
            "views": 3210
        },
        {
            "type": "series",
            "title": "Breaking Bad",
            "synopsis": "Um professor de química se torna um fabricante de metanfetamina.",
            "year": 2008,
            "genres": ["Crime", "Drama", "Thriller"],
            "director": "Vince Gilligan",
            "cast": ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
            "rating": "TV-MA",
            "poster_url": "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
            "banner_url": "https://image.tmdb.org/t/p/original/9faGSFi5jam6pDWGNd0p8JcJgXQ.jpg",
            "published": True,
            "featured": True,
            "views": 4523
        }
    ]
    
    print("Seeding database with sample content...")
    
    for content_data in contents:
        content = Content(**content_data)
        content_dict = content.model_dump()
        content_dict['created_at'] = content_dict['created_at'].isoformat()
        content_dict['updated_at'] = content_dict['updated_at'].isoformat()
        
        # Check if content already exists
        existing = await db.contents.find_one({"title": content.title})
        if not existing:
            await db.contents.insert_one(content_dict)
            print(f"Added: {content.title}")
        else:
            print(f"Already exists: {content.title}")
    
    print("Database seeding completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
