#!/bin/bash

# PrintNet Kubernetes Deployment Script
# This script deploys the scaled PrintNet system to Kubernetes

set -e

echo "🚀 Starting PrintNet Kubernetes deployment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if metrics-server is installed for HPA
echo "📊 Checking metrics-server..."
if ! kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    echo "⚠️  metrics-server not found. Installing..."
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    echo "✅ metrics-server installed"
fi

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Apply ConfigMaps and Secrets
echo "🔧 Applying configuration..."
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# Deploy database and cache
echo "💾 Deploying database and Redis..."
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n printnet --timeout=300s

# Deploy applications
echo "🏗️  Deploying applications..."
kubectl apply -f api-deployment.yaml
kubectl apply -f auth-service.yaml
kubectl apply -f orders-service.yaml

# Deploy load balancer
echo "⚖️  Deploying load balancer..."
kubectl apply -f nginx-configmap.yaml
kubectl apply -f nginx-deployment.yaml

# Deploy monitoring
echo "📈 Deploying monitoring stack..."
kubectl apply -f monitoring.yaml

echo "⏳ Waiting for all deployments to be ready..."

# Wait for all deployments
kubectl wait --for=condition=available deployment --all -n printnet --timeout=600s

echo "✅ All deployments are ready!"

# Get service information
echo ""
echo "🌐 Service Information:"
echo "======================="
kubectl get services -n printnet

echo ""
echo "📊 Pod Status:"
echo "=============="
kubectl get pods -n printnet

echo ""
echo "🔄 HPA Status:"
echo "=============="
kubectl get hpa -n printnet

echo ""
echo "🎉 PrintNet deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "- Access Grafana dashboard: kubectl port-forward svc/grafana-service 3000:3000 -n printnet"
echo "- Access Prometheus: kubectl port-forward svc/prometheus-service 9090:9090 -n printnet"
echo "- Access API through load balancer: kubectl port-forward svc/nginx-loadbalancer-service 8080:80 -n printnet"
echo ""
echo "🧪 To run load tests:"
echo "cd ../load-tests && ./run-tests.sh"
