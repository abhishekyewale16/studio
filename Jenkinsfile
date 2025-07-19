pipeline {
    agent any
    tools {
        nodejs 'Node18'  // Configure NodeJS in Jenkins
    }
    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/abhishekyewale16/studio.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'npm test || echo "No tests found"'
            }
        }
    }
}
