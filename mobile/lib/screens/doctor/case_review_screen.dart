import 'package:flutter/material.dart';

class CaseReviewScreen extends StatefulWidget {
  const CaseReviewScreen({super.key});

  @override
  State<CaseReviewScreen> createState() => _CaseReviewScreenState();
}

class _CaseReviewScreenState extends State<CaseReviewScreen> {
  
  bool _isNightMode = true;
  // Written by the advisory picker; read once the approval call is wired to it.
  // ignore: unused_field
  String _advisory = '';
  final TextEditingController _notesController = TextEditingController();

  final Color _bgDark = const Color(0xFF0B1121);
  final Color _cardDark = const Color(0xFF151C2C);
  final Color _textDark = const Color(0xFFF8FAFC);
  final Color _textMuted = const Color(0xFF94A3B8);
  final Color _primary = const Color(0xFF3B82F6);

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData(
        brightness: _isNightMode ? Brightness.dark : Brightness.light,
        scaffoldBackgroundColor: _isNightMode ? _bgDark : Colors.white,
      ),
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: _isNightMode ? _bgDark : Colors.white,
          elevation: 0,
          title: Text(
            'Case Review Center',
            style: TextStyle(
              color: _isNightMode ? _textDark : Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
          actions: [
            TextButton.icon(
              icon: Icon(
                _isNightMode ? Icons.nightlight_round : Icons.wb_sunny,
                color: _isNightMode ? _textDark : Colors.black,
              ),
              label: Text(
                _isNightMode ? 'NIGHT MODE' : 'DAY MODE',
                style: TextStyle(
                  color: _isNightMode ? _textDark : Colors.black,
                ),
              ),
              onPressed: () {
                setState(() => _isNightMode = !_isNightMode);
              },
            ),
          ],
        ),
        body: LayoutBuilder(
          builder: (context, constraints) {
            if (constraints.maxWidth > 800) {
              return _buildDesktopLayout();
            } else {
              return _buildMobileLayout();
            }
          },
        ),
      ),
    );
  }

  Widget _buildDesktopLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 320, child: _buildSidebar()),
        Expanded(child: _buildMainContent()),
      ],
    );
  }

  Widget _buildMobileLayout() {
    // Standard mobile flow: Queue on top or full page
    // For this example, stack them. In a real app, it would navigate.
    return SingleChildScrollView(
      child: Column(
        children: [
          SizedBox(height: 300, child: _buildSidebar()),
          _buildMainContent(),
        ],
      ),
    );
  }

  Widget _buildSidebar() {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Pending Review', style: TextStyle(color: _textDark, fontSize: 18, fontWeight: FontWeight.bold)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _cardDark,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('6', style: TextStyle(color: _textDark, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildFilterChip('All (6)', true),
                _buildFilterChip('High (2)', false),
                _buildFilterChip('Routine (3)', false),
                _buildFilterChip('Low (1)', false),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildQueueCard('Priya Sharma', '32 years', 'Sharma Family', 'High', '29 Sep, 10:24 AM', true),
                _buildQueueCard('Rahul Kulkarni', '6 years', 'Kulkarni Family', 'Medium', '29 Sep, 09:15 AM', false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (val) {},
        selectedColor: _primary,
        backgroundColor: Colors.transparent,
        labelStyle: TextStyle(color: isSelected ? Colors.white : _textMuted),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: isSelected ? _primary : Colors.white.withValues(alpha: 0.2)),
        ),
      ),
    );
  }

  Widget _buildQueueCard(String name, String age, String family, String priority, String time, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isSelected ? _primary.withValues(alpha: 0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isSelected ? _primary.withValues(alpha: 0.3) : Colors.transparent),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: CircleAvatar(
          backgroundColor: _primary,
          child: Text(name.substring(0, 2).toUpperCase(), style: const TextStyle(color: Colors.white)),
        ),
        title: Text(name, style: TextStyle(color: _textDark, fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$age · $family', style: TextStyle(color: _textMuted, fontSize: 12)),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: priority == 'High' ? Colors.red.withValues(alpha: 0.2) : Colors.orange.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    priority,
                    style: TextStyle(
                      color: priority == 'High' ? Colors.red[300] : Colors.orange[300],
                      fontSize: 10,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(time, style: TextStyle(color: _textMuted, fontSize: 10)),
              ],
            ),
          ],
        ),
        trailing: Icon(Icons.chevron_right, color: _textMuted),
      ),
    );
  }

  Widget _buildMainContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPatientHeader(),
          const SizedBox(height: 24),
          _buildComplaintBox(),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildCard(Icons.medical_services_outlined, Colors.orange, 'Why this case needs review', 'Patient reports fever > 38.5°C\nAI suggests clinical review')),
              const SizedBox(width: 24),
              Expanded(child: _buildCard(Icons.psychology_outlined, Colors.purpleAccent, 'AI findings — plain language', 'Symptoms: Fever, body ache.\nRisk Signals: Possible viral infection.')),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildSafetyChecksCard()),
              const SizedBox(width: 24),
              Expanded(child: _buildVitalsCard()),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildCard(Icons.fingerprint_outlined, Colors.blue, 'Consented family-history context', 'No consented family-history screening indication is available.\n\nA screening indication only — never a diagnosis.')),
              const SizedBox(width: 24),
              Expanded(child: _buildCard(Icons.fact_check_outlined, Colors.blue, 'Supporting reports', 'No supporting reports are available in the authorized records.')),
            ],
          ),
          const SizedBox(height: 24),
          _buildActionSection(),
        ],
      ),
    );
  }

  Widget _buildPatientHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            CircleAvatar(radius: 28, backgroundColor: _primary, child: const Text('PS', style: TextStyle(color: Colors.white, fontSize: 20))),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Priya Sharma', style: TextStyle(color: _textDark, fontSize: 24, fontWeight: FontWeight.bold)),
                Text('32 years · Female · Sharma Family', style: TextStyle(color: _textMuted)),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
              child: Text('⚠ High Priority', style: TextStyle(color: Colors.red[300], fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.orange.withValues(alpha: 0.3))),
              child: Text('🕒 Awaiting Doctor Review', style: TextStyle(color: Colors.orange[300])),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildComplaintBox() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: _cardDark, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.1))),
      child: Row(
        children: [
          Icon(Icons.monitor_heart, color: _primary),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Chief complaint', style: TextStyle(color: _textMuted)),
                const SizedBox(height: 4),
                Text('Fever and body ache for 2 days, with mild headache and sore throat.', style: TextStyle(color: _textDark, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(IconData icon, Color iconColor, String title, String content) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(title, style: TextStyle(color: _textDark, fontSize: 16, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 12),
          Text(content, style: TextStyle(color: _textMuted, height: 1.5)),
        ],
      ),
    );
  }

  Widget _buildSafetyChecksCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.gpp_good_outlined, color: Colors.green, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text('Deterministic safety checks', style: TextStyle(color: _textDark, fontSize: 16, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 12),
          _buildCheckItem('Schema validation passed', true),
          _buildCheckItem('Tool permissions passed', true),
          _buildCheckItem('No emergency red flag recorded in submitted form', true),
        ],
      ),
    );
  }

  Widget _buildCheckItem(String label, bool passed) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(
              passed ? Icons.check : Icons.close,
              color: passed ? Colors.green : Colors.red,
              size: 18,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: _textMuted, fontSize: 13, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVitalsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.monitor_heart_outlined, color: Colors.blue, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text('Latest recorded vitals', style: TextStyle(color: _textDark, fontSize: 16, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final double cardWidth = (constraints.maxWidth - 24) / 4;
              // If it gets too narrow, we'd normally wrap, but for this demo let's use a Wrap
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildEmptyVitalItem('Temperature', cardWidth > 80 ? cardWidth : constraints.maxWidth / 2 - 4),
                  _buildEmptyVitalItem('Heart rate', cardWidth > 80 ? cardWidth : constraints.maxWidth / 2 - 4),
                  _buildEmptyVitalItem('SpO₂', cardWidth > 80 ? cardWidth : constraints.maxWidth / 2 - 4),
                  _buildEmptyVitalItem('Resp. rate', cardWidth > 80 ? cardWidth : constraints.maxWidth / 2 - 4),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyVitalItem(String label, double width) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          Icon(Icons.radio_button_unchecked, color: _primary, size: 24),
          const SizedBox(height: 8),
          Text('—', style: TextStyle(color: _textDark, fontSize: 24, fontWeight: FontWeight.w300, height: 1)),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: _textMuted, fontSize: 12), textAlign: TextAlign.center),
          const SizedBox(height: 2),
          Text('Not available', style: TextStyle(color: _textMuted.withValues(alpha: 0.7), fontSize: 10), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildActionSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF0B172A), // Dark blue premium background
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('DECISION GATE · HUMAN APPROVAL', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
          const SizedBox(height: 4),
          Text('Doctor review and final guidance', style: TextStyle(color: Color(0xFFF8FAFC), fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text('Choose exactly what may become visible to the patient. The AI draft is never approved automatically.', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13)),
          
          const SizedBox(height: 24),
          RichText(text: const TextSpan(children: [
            TextSpan(text: 'Final Patient Guidance ', style: TextStyle(color: Color(0xFFF8FAFC), fontSize: 14, fontWeight: FontWeight.w600)),
            TextSpan(text: '*', style: TextStyle(color: Colors.amber, fontSize: 14, fontWeight: FontWeight.w600)),
          ])),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            /* value: _advisory.isEmpty ? null : _advisory, */
            items: const [
              DropdownMenuItem(value: 'Rest', child: Text('Advise Rest')),
              DropdownMenuItem(value: 'Review', child: Text('Arrange Clinical Review')),
            ],
            onChanged: (v) => setState(() => _advisory = v!),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF334155))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF334155))),
            ),
            dropdownColor: const Color(0xFF0F172A),
            style: const TextStyle(color: Color(0xFFF8FAFC)),
          ),
          const SizedBox(height: 6),
          Text('Doctor-authored or explicitly reviewed text only. No diagnosis, prescriptions or doses in this prototype.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
          
          const SizedBox(height: 20),
          Text('Internal Clinical Notes', style: TextStyle(color: Color(0xFFF8FAFC), fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          TextField(
            controller: _notesController,
            maxLines: 3,
            style: const TextStyle(color: Color(0xFFF8FAFC)),
            decoration: InputDecoration(
              hintText: 'Record your decision rationale or why more information is needed...',
              hintStyle: const TextStyle(color: Color(0xFF64748B)),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF334155))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF334155))),
            ),
          ),
          const SizedBox(height: 6),
          Text('Doctor-only. Never shown to the patient. ${_notesController.text.length}/1000', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
          
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _buildPremiumButton('Approve', Icons.check, const Color(0xFF3B82F6), const Color(0xFF2563EB), const Color(0xFFFFFFFF)),
              _buildPremiumButton('Revise', Icons.edit, const Color(0xFF1E293B), const Color(0xFF334155), const Color(0xFFF8FAFC)),
              _buildPremiumButton('Request info', Icons.message_outlined, const Color(0xFF1E293B), const Color(0xFF334155), const Color(0xFFF8FAFC)),
              _buildPremiumButton('Escalate', Icons.call_made, const Color(0xFF452920), const Color(0xFF7C2D12), const Color(0xFFFDBA74)),
              _buildPremiumButton('Reject', Icons.close, const Color(0xFF4C1D25), const Color(0xFF881337), const Color(0xFFFDA4AF)),
            ],
          ),
          
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.only(top: 12),
            decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF1E293B)))),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Every decision is recorded in the audit log.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                InkWell(
                  onTap: () {
                    setState(() { _advisory = ''; _notesController.clear(); });
                  },
                  child: Text('Clear draft fields', style: TextStyle(color: Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPremiumButton(String label, IconData icon, Color bgColor, Color borderColor, Color textColor) {
    return ElevatedButton.icon(
      onPressed: () {},
      icon: Icon(icon, size: 16, color: textColor),
      label: Text(label, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      style: ElevatedButton.styleFrom(
        backgroundColor: bgColor,
        foregroundColor: textColor,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: borderColor),
        ),
      ),
    );
  }
}
