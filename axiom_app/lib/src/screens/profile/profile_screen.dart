import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profilo')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppTheme.primary.withOpacity(0.2),
                  child: Text(
                    (user?.name ?? 'U')[0].toUpperCase(),
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: AppTheme.primary),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user?.name ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                Text(user?.email ?? '', style: TextStyle(color: Colors.grey[400], fontSize: 14)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.yellow.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('Piano ${user?.plan ?? 'Free'}',
                    style: const TextStyle(color: AppTheme.yellow, fontSize: 12)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _MenuItem(
            icon: Icons.person_outline,
            title: 'Modifica Profilo',
            onTap: () => _showEditProfile(context, auth),
          ),
          _MenuItem(
            icon: Icons.currency_exchange,
            title: 'Valuta Predefinita',
            trailing: Text(user?.currency ?? 'EUR', style: TextStyle(color: Colors.grey[400])),
            onTap: () => _showCurrencyPicker(context, auth),
          ),
          _MenuItem(
            icon: Icons.palette_outlined,
            title: 'Tema',
            trailing: Icon(auth.user?.theme == 'light' ? Icons.light_mode : Icons.dark_mode,
              color: Colors.grey[400], size: 20),
            onTap: () => auth.updateProfile(theme: auth.user?.theme == 'dark' ? 'light' : 'dark'),
          ),
          const Divider(height: 32),
          _MenuItem(
            icon: Icons.logout,
            title: 'Esci',
            color: AppTheme.primary,
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Sei sicuro di voler uscire?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annulla')),
                    TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Esci')),
                  ],
                ),
              );
              if (confirm == true) auth.logout();
            },
          ),
        ],
      ),
    );
  }

  void _showEditProfile(BuildContext context, AuthProvider auth) {
    final controller = TextEditingController(text: auth.user?.name ?? '');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Modifica Profilo'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Nome'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annulla')),
          TextButton(onPressed: () {
            auth.updateProfile(name: controller.text.trim());
            Navigator.pop(ctx);
          }, child: const Text('Salva')),
        ],
      ),
    );
  }

  void _showCurrencyPicker(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Valuta'),
        children: ['EUR', 'USD', 'CHF', 'GBP'].map((c) => SimpleDialogOption(
          child: Text(c),
          onPressed: () {
            auth.updateProfile(currency: c);
            Navigator.pop(ctx);
          },
        )).toList(),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget? trailing;
  final Color? color;
  final VoidCallback onTap;

  const _MenuItem({required this.icon, required this.title, this.trailing, this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color ?? Colors.grey[300]),
      title: Text(title, style: TextStyle(color: color ?? Colors.grey[200])),
      trailing: trailing ?? const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }
}
