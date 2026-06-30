import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class _AxiomLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 108;
    final bg = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(size.width * 0.22),
    );
    canvas.drawRRect(bg, Paint()..color = const Color(0xFF0F172A));
    final red1 = Paint()
      ..color = const Color(0xFFEF4444)
      ..strokeWidth = 6 * s
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final red2 = Paint()
      ..color = const Color(0xFFDC2626)
      ..strokeWidth = 6 * s
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final blue1 = Paint()
      ..color = const Color(0xFF2563EB)
      ..strokeWidth = 4.5 * s
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final blue2 = Paint()
      ..color = const Color(0xFF06B6D4)
      ..strokeWidth = 4.5 * s
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final cx = size.width / 2;
    final cy = size.height / 2;
    canvas.drawLine(Offset(cx - 0.24 * size.width, cy + 0.3 * size.height), Offset(cx, cy - 0.3 * size.height), red1);
    canvas.drawLine(Offset(cx, cy - 0.3 * size.height), Offset(cx + 0.24 * size.width, cy + 0.3 * size.height), red2);
    canvas.drawLine(Offset(cx - 0.13 * size.width, cy + 0.02 * size.height), Offset(cx + 0.13 * size.width, cy + 0.1 * size.height), blue1);
    canvas.drawLine(Offset(cx + 0.13 * size.width, cy + 0.02 * size.height), Offset(cx - 0.13 * size.width, cy + 0.1 * size.height), blue2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final provider = context.read<AuthProvider>();
    final success = await provider.login(
      _emailController.text.trim(),
      _passwordController.text,
    );
    if (success && mounted) {
      context.go('/');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Errore di accesso')),
      );
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _loading = true);
    final provider = context.read<AuthProvider>();
    final success = await provider.signInWithGoogle();
    if (success && mounted) {
      context.go('/');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Errore Google Sign-In')),
      );
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF080612), Color(0xFF0F1130), Color(0xFF181B3D)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 80, height: 80,
                      child: CustomPaint(
                        painter: _AxiomLogoPainter(),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Axiom',
                      style: TextStyle(
                        fontSize: 32, fontWeight: FontWeight.w800,
                        foreground: Paint()..shader = LinearGradient(
                          colors: [AppTheme.primary, AppTheme.accent],
                        ).createShader(const Rect.fromLTWH(0, 0, 200, 50)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Accedi al tuo account',
                      style: TextStyle(color: Colors.grey[400], fontSize: 16)),
                    const SizedBox(height: 40),
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Inserisci email';
                        if (!v.contains('@')) return 'Email non valida';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outlined),
                        suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      obscureText: _obscure,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Inserisci password';
                        if (v.length < 6) return 'Password troppo corta';
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity, height: 50,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _login,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _loading
                            ? const SizedBox(width: 24, height: 24,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Accedi',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        const Expanded(child: Divider(color: Colors.white12)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text('oppure', style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                        ),
                        const Expanded(child: Divider(color: Colors.white12)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity, height: 50,
                      child: OutlinedButton.icon(
                        onPressed: _loading ? null : _signInWithGoogle,
                        icon: const Icon(Icons.g_mobiledata, size: 24),
                        label: const Text('Continua con Google',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: BorderSide(color: Colors.grey[600]!),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => Navigator.pushNamed(context, '/register'),
                      child: const Text("Non hai un account? Registrati"),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pushNamed(context, '/reset-password'),
                      child: Text('Password dimenticata?',
                        style: TextStyle(color: Colors.grey[400])),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
