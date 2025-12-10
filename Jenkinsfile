pipeline {
  agent any

  environment {
    IMAGE_NAME = "jenkins-cicd-sample-app"
  }

  tools {
    nodejs 'NodeJS 20' // Make sure this matches your NodeJS installation in Jenkins
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare') {
      steps {
        script {
          // Make branch/tag safe for later use
          env.BRANCH_SAFE = env.BRANCH_NAME ?: 'local'
          env.TAG = env.BRANCH_SAFE.replaceAll('[^a-zA-Z0-9_.-]', '_')
          echo "Branch: ${env.BRANCH_SAFE}, TAG: ${env.TAG}"
        }
      }
    }

    stage('Install & Test') {
      steps {
        dir('app') { // npm commands run in app folder
          script {
            echo "Installing dependencies and running tests"
            sh 'npm install'
            sh 'mkdir -p test-results'
            sh 'npm test || true' // continue even if tests fail
          }
        }
      }
    }

    stage('Build Image') {
      steps {
        script {
          echo "Building Docker image ${IMAGE_NAME}:${TAG}"
          dir("${env.WORKSPACE}") {
            sh "docker build -t ${IMAGE_NAME}:${TAG} ."
          }
        }
      }
    }

    stage('Deploy to environment') {
      steps {
        script {
          def branch = env.BRANCH_SAFE
          echo "Deploying for branch ${branch}"

          if (branch == 'main' || branch ==~ /release\/.*/) {
            echo "Deploying to UAT"
            sh "docker rm -f app_uat || true"
            sh "docker run -d --name app_uat -e ENV=uat -p 3003:3000 ${IMAGE_NAME}:${TAG}"
          } else if (branch == 'develop') {
            echo "Deploying to Dev"
            sh "docker rm -f app_dev || true"
            sh "docker run -d --name app_dev -e ENV=dev -p 3001:3000 ${IMAGE_NAME}:${TAG}"
          } else if (branch ==~ /feature\/.*/ || branch == 'feature') {
            echo "Deploying to QA (feature branch)"
            def safeName = branch.replaceAll('[^a-zA-Z0-9]', '_')
            sh "docker rm -f app_${safeName} || true"
            sh "docker run -d --name app_${safeName} -e ENV=qa -p 3002:3000 ${IMAGE_NAME}:${TAG}"
          } else if (branch ==~ /hotfix\/.*/ ) {
            echo "Deploying hotfix to QA and UAT"
            sh "docker rm -f app_qa || true"
            sh "docker run -d --name app_qa -e ENV=qa -p 3002:3000 ${IMAGE_NAME}:${TAG}"
            sh "docker rm -f app_uat || true"
            sh "docker run -d --name app_uat -e ENV=uat -p 3003:3000 ${IMAGE_NAME}:${TAG}"
          } else {
            echo "Unrecognized branch pattern — defaulting to Dev"
            sh "docker rm -f app_dev || true"
            sh "docker run -d --name app_dev -e ENV=dev -p 3001:3000 ${IMAGE_NAME}:${TAG}"
          }
        }
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'app/test-results/**/*.xml'
      archiveArtifacts artifacts: '**/target/*.jar', allowEmptyArchive: true
    }
  }
}
