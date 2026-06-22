# TODO: Will add vars to this
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
    region  = "ap-south-1"
}

terraform {
  backend "s3" {
    bucket = "tf-state-sample-9123"
    key    = "sample.tfstate"
    region = "ap-south-1"
  }
}

resource "aws_security_group" "allow_ssh" {
    name        = "terraform-learning-allow-ssh"
    description = "Allow SSH inbound"

    ingress {
        description = "SSH from my IP"
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"] // TODO: Will add var using github repo var
    }

    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "terraform-learning-sg"
    }
}

resource "aws_instance" "my_first_server" {
  ami           = "ami-01a00762f46d584a1"
  instance_type = "t3.micro"
  vpc_security_group_ids = [aws_security_group.allow_ssh.id]
  key_name               = "vignesh"
  user_data = <<-EOF
    #!/bin/bash
    # Update packages and install prerequisites
    sudo apt-get update -y
    sudo apt-get install -y curl unzip

    # Download and run the official Bun installer
    export HOME="/home/ubuntu"
    curl -fsSL https://bun.com/install | bash

    # Add Bun to the global PATH for the current shell and subsequent sessions
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    source /home/ubuntu/.bashrc


    export DEBIAN_FRONTEND=noninteractive
    apt update -y
    apt install -y ca-certificates curl

    apt remove -y docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc || true

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    tee /etc/apt/sources.list.d/docker.sources <<DOCKER_SOURCES
    Types: deb
    URIs: https://download.docker.com/linux/ubuntu
    Suites: $(. /etc/os-release && echo "$${UBUNTU_CODENAME:-$VERSION_CODENAME}")
    Components: stable
    Architectures: $(dpkg --print-architecture)
    Signed-By: /etc/apt/keyrings/docker.asc

    DOCKER_SOURCES

    apt update -y

    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl enable docker
    systemctl start docker

    git clone https://github.com/Vignesh9123/deploy-kit /home/ubuntu/deploy-kit
    chown -R ubuntu:ubuntu /home/ubuntu/deploy-kit
EOF

  tags = {
    Name = "terraform-learning-instance"
  }
}


output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.my_first_server.public_ip
}