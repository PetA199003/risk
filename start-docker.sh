#!/bin/bash

# GBU Veranstaltungsmanagement - Docker Startup Script

echo "🚀 Starting GBU Veranstaltungsmanagement System"
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ docker not found. Please install docker."
    exit 1
fi

# Check if docker compose plugin is available
if ! docker compose version &> /dev/null; then
    echo "❌ docker compose plugin not found. Please install docker compose plugin."
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [dev|prod|stop|logs|clean]"
    echo ""
    echo "Commands:"
    echo "  dev     - Start development environment with hot reload"
    echo "  prod    - Start production environment"
    echo "  stop    - Stop all containers"
    echo "  logs    - Show container logs"
    echo "  clean   - Stop containers and remove volumes/images"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Start development server"
    echo "  $0 prod     # Start production server"
    echo "  $0 stop     # Stop all services"
}

# Parse command line arguments
case "${1:-prod}" in
    "dev")
        echo "🔧 Starting DEVELOPMENT environment..."
        echo "- Hot reload enabled"
        echo "- Development dependencies included"
        echo "- Port: http://localhost:3000"
        echo ""
        docker compose -f docker-compose.dev.yml up --build
        ;;
    "prod")
        echo "🏭 Starting PRODUCTION environment..."
        echo "- Optimized build"
        echo "- Production dependencies only"
        echo "- Port: http://localhost:3000"
        echo ""
        docker compose up --build
        ;;
    "stop")
        echo "🛑 Stopping all containers..."
        docker compose down
        docker compose -f docker-compose.dev.yml down
        echo "✅ All containers stopped"
        ;;
    "logs")
        echo "📋 Showing container logs..."
        docker compose logs -f
        ;;
    "clean")
        echo "🧹 Cleaning up containers, volumes, and images..."
        docker compose down -v --rmi all
        docker compose -f docker-compose.dev.yml down -v --rmi all
        echo "✅ Cleanup completed"
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac