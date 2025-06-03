#!/bin/bash

# PrintNet System Test Script
# Quick verification that the scaled system is working

set -e

echo "🔍 Testing PrintNet Scaled System"
echo "================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

echo "📦 Checking namespace..."
if ! kubectl get namespace printnet &> /dev/null; then
    echo "❌ PrintNet namespace not found. Please deploy the system first:"
    echo "   cd k8s && ./deploy.sh"
    exit 1
fi

echo "✅ Namespace exists"

echo ""
echo "🏗️  Checking deployments..."
kubectl get deployments -n printnet

echo ""
echo "📊 Checking pod status..."
kubectl get pods -n printnet

echo ""
echo "🔄 Checking HPA status..."
kubectl get hpa -n printnet

echo ""
echo "🌐 Checking services..."
kubectl get services -n printnet

echo ""
echo "📈 Checking resource usage..."
kubectl top pods -n printnet 2>/dev/null || echo "⚠️  Metrics not available yet (normal if just deployed)"

echo ""
echo "🏥 Health check tests..."

# Start port-forward in background for testing
echo "Starting port-forward for testing..."
kubectl port-forward svc/nginx-loadbalancer-service 8080:80 -n printnet &
PORT_FORWARD_PID=$!

# Wait for port-forward to establish
sleep 5

# Function to cleanup port-forward
cleanup() {
    echo "🧹 Cleaning up port-forward..."
    kill $PORT_FORWARD_PID 2>/dev/null || true
}
trap cleanup EXIT

# Test health endpoint
echo "Testing health endpoint..."
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    echo "✅ Health endpoint responding"
else
    echo "❌ Health endpoint not responding"
    echo "   This might be normal if pods are still starting up"
fi

echo ""
echo "🎯 System Test Summary"
echo "====================="

# Count running pods
RUNNING_PODS=$(kubectl get pods -n printnet --field-selector=status.phase=Running --no-headers | wc -l)
TOTAL_PODS=$(kubectl get pods -n printnet --no-headers | wc -l)

echo "Running pods: $RUNNING_PODS/$TOTAL_PODS"

# Check if HPA is active
HPA_COUNT=$(kubectl get hpa -n printnet --no-headers | wc -l)
echo "HPA controllers: $HPA_COUNT"

# Check if services are available
SERVICE_COUNT=$(kubectl get services -n printnet --no-headers | wc -l)
echo "Services: $SERVICE_COUNT"

echo ""
if [ "$RUNNING_PODS" -eq "$TOTAL_PODS" ] && [ "$HPA_COUNT" -gt 0 ]; then
    echo "🎉 System appears to be healthy and ready for load testing!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Keep the port-forward running: kubectl port-forward svc/nginx-loadbalancer-service 8080:80 -n printnet"
    echo "2. Run load tests: cd load-tests && ./run-tests.sh"
    echo "3. Monitor scaling: watch kubectl get pods -n printnet"
    echo "4. View metrics: kubectl port-forward svc/grafana-service 3000:3000 -n printnet"
else
    echo "⚠️  System may still be starting up. Please wait a few minutes and run this script again."
    echo ""
    echo "🔍 Troubleshooting:"
    echo "- Check pod logs: kubectl logs -f deployment/printnet-api -n printnet"
    echo "- Check events: kubectl get events -n printnet --sort-by='.lastTimestamp'"
fi
