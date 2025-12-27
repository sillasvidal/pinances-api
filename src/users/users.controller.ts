import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('tutorial/step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tutorial step' })
  @ApiResponse({ status: 200, description: 'Tutorial step updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTutorialStep(
    @Request() req,
    @Body() body: { step: number },
  ) {
    return this.usersService.updateTutorialStep(req.user.id, body.step);
  }

  @Patch('tutorial/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark tutorial as completed' })
  @ApiResponse({ status: 200, description: 'Tutorial completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeTutorial(@Request() req) {
    return this.usersService.completeTutorial(req.user.id);
  }

  @Patch('tutorial/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip tutorial' })
  @ApiResponse({ status: 200, description: 'Tutorial skipped' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async skipTutorial(@Request() req) {
    return this.usersService.skipTutorial(req.user.id);
  }

  @Patch('tutorial/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restart tutorial' })
  @ApiResponse({ status: 200, description: 'Tutorial restarted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async restartTutorial(@Request() req) {
    return this.usersService.restartTutorial(req.user.id);
  }
}
