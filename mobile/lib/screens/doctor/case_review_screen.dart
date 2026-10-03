import 'package:flutter/material.dart';

class CaseReviewScreen extends StatefulWidget {
  const CaseReviewScreen({super.key});

  @override
  State<CaseReviewScreen> createState() => _CaseReviewScreenState();
}

class _CaseReviewScreenState extends State<CaseReviewScreen> {
  
  bool _isNightMode = true;
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
              Expanded(child: _buildCard('⚠ Why this needs review', 'Patient reports fever > 38.5°C\nAI suggests clinical review')),
              const SizedBox(width: 24),
              Expanded(child: _buildCard('🧠 AI Summary', 'Symptoms: Fever, body ache.\nRisk Signals: Possible viral infection.')),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildCard('🛡 Safety checks', '✅ Triage questionnaire completed\n✅ No red flag symptoms detected')),
              const SizedBox(width: 24),
              Expanded(child: _buildCard('❤ Vitals Snapshot', '38.8°C Temperature\n92 bpm Heart rate')),
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

  Widget _buildCard(String title, String content) {
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
          Text(title, style: TextStyle(color: _textDark, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(content, style: TextStyle(color: _textMuted, height: 1.5)),
        ],
      ),
    );
  }

  Widget _buildActionSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('📝 Doctor Notes', style: TextStyle(color: _textDark, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            maxLines: 3,
            style: TextStyle(color: _textDark),
            decoration: InputDecoration(
              hintText: 'Add your clinical notes...',
              hintStyle: TextStyle(color: _textMuted),
              filled: true,
              fillColor: _bgDark,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),
          Text('📄 Final Guidance', style: TextStyle(color: _textDark, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            /* value: _advisory.isEmpty ? null : _advisory, */
            items: const [
              DropdownMenuItem(value: 'Rest', child: Text('Advise Rest')),
              DropdownMenuItem(value: 'Review', child: Text('Arrange Clinical Review')),
            ],
            onChanged: (v) => setState(() => _advisory = v!),
            decoration: InputDecoration(
              filled: true,
              fillColor: _bgDark,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
            dropdownColor: _bgDark,
            style: TextStyle(color: _textDark),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Approve Guidance'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.all(16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.edit),
                  label: const Text('Edit Before Approving'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _textDark,
                    side: BorderSide(color: _textMuted),
                    padding: const EdgeInsets.all(16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.warning_amber),
                  label: const Text('Reject'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.withValues(alpha: 0.8),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.all(16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
