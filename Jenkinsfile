pipeline {
  agent any
  environment {
    IMAGE_NAME = "jenkins-cicd-sample-app"
  }
  tools {
    nodejs 'NodeJS 20' // make sure this matches your Jenkins tool config
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
            // run tests but do not fail the pipeline on test failure
            sh 'npm test || true'
          }
        }
      }
    }

    stage('Build Image') {
      steps {
        script {
          echo "Building Docker image ${env.IMAGE_NAME}:${env.TAG}"
          dir("${env.WORKSPACE}") {
            // use env.* so Groovy interpolates correctly
            sh "docker build -t ${env.IMAGE_NAME}:${env.TAG} ."
          }
        }
      }
    }

    stage('Deploy to environment') {
      steps {
        script {
          def branch = env.BRANCH_SAFE
          // choose unique safeName for containers derived from branch
          def safeName = branch.replaceAll('[^a-zA-Z0-9]', '_')
          // compute a quasi-unique host port to avoid conflicts when many feature branches run concurrently
          def basePort = 3000
          def portOffset = Math.abs(branch.hashCode()) % 1000  // 0..999
          def hostPort = basePort + 1 + portOffset // starts from 3001

          echo "Deploying for branch ${branch} as container app_${safeName} on host port ${hostPort}"

          if (branch == 'main' || branch ==~ /release\/.*/) {
            echo "Deploying to UAT"
            sh "docker rm -f app_uat || true"
            sh "docker run -d --name app_uat -e ENV=uat -p 3003:3000 ${env.IMAGE_NAME}:${env.TAG}"
          } else if (branch == 'develop') {
            echo "Deploying to Dev"
            sh "docker rm -f app_dev || true"
            sh "docker run -d --name app_dev -e ENV=dev -p 3001:3000 ${env.IMAGE_NAME}:${env.TAG}"
          } else if (branch ==~ /feature\/.*/ || branch == 'feature') {
            echo "Deploying feature branch to QA (unique container)"
            // Use a branch-derived container name and computed hostPort to reduce collisions
            sh "docker rm -f app_${safeName} || true"
            sh "docker run -d --name app_${safeName} -e ENV=qa -p ${hostPort}:3000 ${env.IMAGE_NAME}:${env.TAG}"
          } else if (branch ==~ /hotfix\/.*/) {
            echo "Deploying hotfix to QA and UAT"
            // run QA instance
            sh "docker rm -f app_${safeName}_qa || true"
            sh "docker run -d --name app_${safeName}_qa -e ENV=qa -p 3002:3000 ${env.IMAGE_NAME}:${env.TAG}"
            // run UAT instance
            sh "docker rm -f app_${safeName}_uat || true"
            sh "docker run -d --name app_${safeName}_uat -e ENV=uat -p 3003:3000 ${env.IMAGE_NAME}:${env.TAG}"
          } else {
            echo "Unrecognized branch pattern — defaulting to Dev"
            sh "docker rm -f app_dev || true"
            sh "docker run -d --name app_dev -e ENV=dev -p 3001:3000 ${env.IMAGE_NAME}:${env.TAG}"
          }
        }
      }
    }
  }

  post {
    always {
      // publish junit test results if any
      junit allowEmptyResults: true, testResults: 'app/test-results/**/*.xml'
      archiveArtifacts artifacts: '**/target/*.jar', allowEmptyArchive: true
    }
  }
}
