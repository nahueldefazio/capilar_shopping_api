"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://capilarshopping.com',
        'https://www.capilarshopping.com',
        'https://lemonchiffon-goldfish-284566.hostingersite.com',
        'https://navajowhite-quetzal-176085.hostingersite.com',
        'https://capilarshopping-com-622134.hostingersite.com',
    ].filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.getHttpAdapter().getInstance().get('/', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'Luvira API',
            health: '/api/health',
        });
    });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 API running on http://localhost:${port}/api`);
    console.log(`🏥 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map