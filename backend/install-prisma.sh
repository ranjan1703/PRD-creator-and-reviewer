#!/bin/bash
# Uninstall Prisma 7.x and install stable Prisma 5.x
npm uninstall prisma @prisma/client
npm install prisma@5.22.0 @prisma/client@5.22.0 bcryptjs@2.4.3
npm install --save-dev @types/bcryptjs@2.4.6
