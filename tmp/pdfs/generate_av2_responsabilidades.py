from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from pathlib import Path


ROOT = Path(r"C:\Users\luist\Documents\farm-control-stock")
OUTPUT = ROOT / "output" / "pdf" / "responsabilidades_av2_farm_control_stock.pdf"

font_dir = Path(r"C:\Windows\Fonts")
pdfmetrics.registerFont(TTFont("Segoe", str(font_dir / "segoeui.ttf")))
pdfmetrics.registerFont(TTFont("SegoeBold", str(font_dir / "segoeuib.ttf")))

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#17324D")
TEAL = colors.HexColor("#087E8B")
GREEN = colors.HexColor("#2F855A")
LIGHT = colors.HexColor("#F3F7F9")
MID = colors.HexColor("#D8E3E8")
TEXT = colors.HexColor("#24323D")
MUTED = colors.HexColor("#5D6B75")
WHITE = colors.white


def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, PAGE_H - 1.25 * cm, PAGE_W, 1.25 * cm, fill=1, stroke=0)
        canvas.setFont("SegoeBold", 9)
        canvas.setFillColor(WHITE)
        canvas.drawString(1.6 * cm, PAGE_H - 0.78 * cm, "FARM CONTROL STOCK | AV2")
        canvas.setFont("Segoe", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(1.6 * cm, 0.75 * cm, "Distribución de responsabilidades - Semana 11")
        canvas.drawRightString(PAGE_W - 1.6 * cm, 0.75 * cm, f"Página {doc.page}")
        canvas.setStrokeColor(MID)
        canvas.line(1.6 * cm, 1.05 * cm, PAGE_W - 1.6 * cm, 1.05 * cm)
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=1.6 * cm,
    leftMargin=1.6 * cm,
    topMargin=1.65 * cm,
    bottomMargin=1.35 * cm,
    title="Distribución de responsabilidades AV2 - Farm Control Stock",
    author="Equipo Farm Control Stock",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=frame, onPage=header_footer)])

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontName="SegoeBold", fontSize=25, leading=30, textColor=WHITE, alignment=TA_LEFT, spaceAfter=10))
styles.add(ParagraphStyle(name="CoverSub", fontName="Segoe", fontSize=12, leading=18, textColor=colors.HexColor("#D8F0F2"), alignment=TA_LEFT))
styles.add(ParagraphStyle(name="H1x", fontName="SegoeBold", fontSize=17, leading=21, textColor=NAVY, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle(name="H2x", fontName="SegoeBold", fontSize=12.5, leading=16, textColor=TEAL, spaceBefore=5, spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx", fontName="Segoe", fontSize=9.4, leading=13.3, textColor=TEXT, spaceAfter=5))
styles.add(ParagraphStyle(name="Smallx", fontName="Segoe", fontSize=8.2, leading=11.5, textColor=MUTED))
styles.add(ParagraphStyle(name="Bulletx", fontName="Segoe", fontSize=9.15, leading=12.7, leftIndent=13, firstLineIndent=-7, bulletIndent=2, textColor=TEXT, spaceAfter=3))
styles.add(ParagraphStyle(name="RoleName", fontName="SegoeBold", fontSize=14, leading=18, textColor=NAVY, spaceAfter=2))
styles.add(ParagraphStyle(name="RoleTitle", fontName="SegoeBold", fontSize=10.5, leading=14, textColor=TEAL, spaceAfter=8))
styles.add(ParagraphStyle(name="Cell", fontName="Segoe", fontSize=8.2, leading=10.5, textColor=TEXT))
styles.add(ParagraphStyle(name="CellBold", fontName="SegoeBold", fontSize=8.2, leading=10.5, textColor=NAVY))
styles.add(ParagraphStyle(name="CellHeader", fontName="SegoeBold", fontSize=8.2, leading=10.5, textColor=WHITE))


roles = [
    {
        "number": 1,
        "name": "Miranda Arroyo, Juan Diego",
        "title": "Gestión del repositorio y coordinación del proyecto",
        "branch": "feature/gestion-proyecto",
        "summary": "Será responsable de organizar el trabajo colaborativo y de comprobar que cada actividad quede registrada y sea trazable en GitHub.",
        "tasks": [
            "Creará el tablero con las columnas Por hacer, En curso, En revisión y Hecho.",
            "Registrará las actividades como historias de usuario y asignará responsable, prioridad, etiqueta y sprint.",
            "Comprobará que cada issue se relacione con una rama, un pull request y sus commits.",
            "Mantendrá coordinadas las ramas main y develop y evitará fusiones directas sin revisión.",
            "Documentará los acuerdos del equipo: horario, responsables de revisión y plazo máximo de 24 horas.",
            "Elaborará las actas de planificación, review y retrospectiva.",
            "Actualizará el acta de constitución, la EDT y el cronograma.",
            "Comparará las fechas planificadas con las fechas ejecutadas y justificará las desviaciones.",
        ],
        "deliverables": [
            "Tablero de actividades con trazabilidad completa.",
            "Acta de constitución, EDT y cronograma actualizados.",
            "Actas de reuniones y capturas del tablero al inicio y cierre del sprint.",
        ],
    },
    {
        "number": 2,
        "name": "Teran Saucedo, Luis Armando",
        "title": "Frontend de inventario y alertas",
        "branch": "feature/inventario-alertas",
        "summary": "Será responsable de convertir las pantallas de almacén en interfaces funcionales conectadas con el backend.",
        "tasks": [
            "Reemplazará los datos estáticos del inventario por información obtenida desde la API.",
            "Implementará la búsqueda por producto, lote o categoría y los filtros por estado.",
            "Mostrará los productos disponibles, con stock bajo y próximos a vencer.",
            "Implementará estados de carga, ausencia de información, error y confirmación.",
            "Integrará los formularios de entrada y salida con los endpoints del backend.",
            "Corregirá la navegación de acuerdo con los roles administrador y almacén.",
            "Verificará la presentación de las pantallas en computadoras y celulares.",
            "Preparará capturas claras de cada flujo terminado para el informe y la sustentación.",
        ],
        "deliverables": [
            "Inventario conectado con datos reales y filtros funcionales.",
            "Alertas visuales de vencimiento y stock bajo.",
            "Formularios funcionales de entrada y salida, con validaciones y mensajes.",
        ],
    },
    {
        "number": 3,
        "name": "Benavides Sanchez, Omar",
        "title": "Backend, control de stock y kardex",
        "branch": "feature/kardex-stock",
        "summary": "Será responsable de completar la lógica principal del módulo de lotes y vencimientos.",
        "tasks": [
            "Completará el CRUD de lotes e implementará la edición y desactivación de registros.",
            "Creará el endpoint para registrar salidas y reducirá el stock del lote correspondiente.",
            "Evitará que se registre una salida superior a la cantidad disponible.",
            "Registrará automáticamente todas las entradas y salidas en el kardex.",
            "Implementará consultas para productos próximos a vencer y productos con stock bajo.",
            "Validará fechas, cantidades, productos, proveedores y códigos de lote.",
            "Mantendrá protegidas las rutas mediante autenticación y roles.",
            "Documentará las rutas, parámetros, respuestas y errores de la API.",
        ],
        "deliverables": [
            "CRUD funcional de lotes y endpoints documentados.",
            "Registro real de entradas, salidas y movimientos de kardex.",
            "Consultas de alertas y evidencias de las respuestas de la API.",
        ],
    },
    {
        "number": 4,
        "name": "Cerna Woolcott, Ricardo Joel",
        "title": "Informe de investigación y referencias",
        "branch": "docs/informe-av2",
        "summary": "Será responsable de actualizar y consolidar el informe académico exigido para el AV2.",
        "tasks": [
            "Corregirá el título, la formulación del problema y los objetivos presentados en el AV1.",
            "Redactará entre ocho y diez antecedentes recientes relacionados con usabilidad y SUS.",
            "Elaborará el marco teórico sobre ISO 9241-11, usabilidad percibida, SUS, inventario, lotes y vencimientos.",
            "Redactará la hipótesis alterna y la hipótesis nula, incluidas sus expresiones simbólicas.",
            "Documentará las etapas de análisis, diseño, construcción, pruebas, despliegue y evaluación.",
            "Describirá Scrum mediante sus roles, eventos, artefactos y evidencias de los sprints.",
            "Gestionará las fuentes con Zotero y aplicará el formato IEEE.",
            "Revisará la redacción en tercera persona y en pasado; además, generará el reporte de Turnitin.",
        ],
        "deliverables": [
            "Informe completo y corregido hasta el contenido requerido en el AV2.",
            "Antecedentes, marco teórico, hipótesis y metodología de desarrollo.",
            "Referencias IEEE, biblioteca de Zotero, declaración de IA y Turnitin igual o menor al 20 %.",
        ],
    },
    {
        "number": 5,
        "name": "Mendoza Cerna, Nohelia Corazon",
        "title": "Pruebas, cuestionario SUS y sustentación",
        "branch": "test/pruebas-sus",
        "summary": "Será responsable de verificar el módulo, preparar la evaluación de usabilidad y coordinar la demostración.",
        "tasks": [
            "Elaborará una matriz de casos de prueba para autenticación, lotes, entradas, salidas, kardex y alertas.",
            "Registrará los errores encontrados y comprobará sus correcciones.",
            "Preparará el cuestionario SUS con las diez afirmaciones y su escala de respuesta.",
            "Elaborará el formulario y el procedimiento de aplicación.",
            "Definirá el plan para evaluar a 30 trabajadores de venta y 30 trabajadores de almacén.",
            "Preparará el texto de presentación o consentimiento dirigido a los participantes.",
            "Organizará el guion de demostración de diez minutos y las evidencias de pruebas.",
            "Verificará que el sistema pueda ejecutarse mediante las instrucciones del README.",
        ],
        "deliverables": [
            "Matriz de pruebas, registro de errores y evidencias de corrección.",
            "Cuestionario SUS y plan de aplicación a 60 usuarios.",
            "Guion de sustentación y lista de verificación final de la entrega.",
        ],
    },
]


story = []

# Cover
cover_box = Table(
    [[Paragraph("AV2 - Distribución de responsabilidades", styles["CoverTitle"]),
      Paragraph("Farm Control Stock<br/>Semana 11 - Sesión 22", styles["CoverSub"])]],
    colWidths=[11.8 * cm, 5.1 * cm],
    rowHeights=[7.0 * cm],
)
cover_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (0, 0), 22),
    ("RIGHTPADDING", (0, 0), (0, 0), 18),
    ("BACKGROUND", (1, 0), (1, 0), TEAL),
    ("LEFTPADDING", (1, 0), (1, 0), 18),
]))
story += [Spacer(1, 2.2 * cm), cover_box, Spacer(1, 1.0 * cm)]
story.append(Paragraph("Asignación aleatoria", styles["H1x"]))
cover_data = [[Paragraph(f"{r['number']}", styles["CellBold"]), Paragraph(r["name"], styles["CellBold"]), Paragraph(r["title"], styles["Cell"])] for r in roles]
cover_table = Table(cover_data, colWidths=[0.8 * cm, 5.8 * cm, 10.3 * cm])
cover_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
    ("GRID", (0, 0), (-1, -1), 0.5, MID),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("ALIGN", (0, 0), (0, -1), "CENTER"),
]))
story += [cover_table, Spacer(1, 0.7 * cm), Paragraph("Documento de trabajo para el reparto de actividades, seguimiento del sprint y preparación de evidencias del AV2.", styles["Smallx"]), PageBreak()]

story.append(Paragraph("Criterios de trabajo del equipo", styles["H1x"]))
intro = [
    "Cada integrante desarrollará su responsabilidad principal en una rama separada.",
    "Cada actividad deberá comenzar como un issue y finalizar mediante un pull request revisado.",
    "Ningún integrante fusionará directamente su propio trabajo en develop.",
    "Cada integrante creará al menos un pull request y revisará el de otra persona con comentarios verificables.",
    "Los cinco integrantes conocerán el funcionamiento completo del sistema y participarán en la sustentación.",
]
for item in intro:
    story.append(Paragraph(item, styles["Bulletx"], bulletText="•"))
story += [Spacer(1, 0.4 * cm)]

for idx, role in enumerate(roles):
    if idx > 0:
        story.append(PageBreak())
    heading = Table([
        [Paragraph(str(role["number"]), ParagraphStyle(name=f"Num{idx}", fontName="SegoeBold", fontSize=22, textColor=WHITE, alignment=TA_CENTER)),
         Paragraph(role["name"], styles["RoleName"])],
        ["", Paragraph(role["title"], styles["RoleTitle"])],
    ], colWidths=[1.25 * cm, 15.65 * cm])
    heading.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), TEAL),
        ("SPAN", (0, 0), (0, 1)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (1, 0), (1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (1, 1), (1, 1), 1, MID),
    ]))
    story += [heading, Spacer(1, 0.35 * cm), Paragraph(role["summary"], styles["Bodyx"]), Paragraph("Responsabilidades", styles["H2x"])]
    for task in role["tasks"]:
        story.append(Paragraph(task, styles["Bulletx"], bulletText="•"))
    story.append(Spacer(1, 0.2 * cm))
    block = []
    block.append(Paragraph("Entregables", styles["H2x"]))
    for deliverable in role["deliverables"]:
        block.append(Paragraph(deliverable, styles["Bulletx"], bulletText="•"))
    block.append(Spacer(1, 0.2 * cm))
    branch_table = Table([[Paragraph("Rama sugerida", styles["CellBold"]), Paragraph(role["branch"], styles["Cell"])]], colWidths=[3.2 * cm, 13.7 * cm])
    branch_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), MID),
        ("BACKGROUND", (1, 0), (1, 0), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.7, MID),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    block.append(branch_table)
    story.append(KeepTogether(block))

story.append(PageBreak())
story.append(Paragraph("Matriz de revisión de pull requests", styles["H1x"]))
story.append(Paragraph("La revisión será circular. El revisor deberá leer los cambios, formular observaciones concretas y verificar las correcciones antes de aprobar.", styles["Bodyx"]))
review_pairs = [
    (roles[0]["name"], roles[3]["name"]),
    (roles[1]["name"], roles[2]["name"]),
    (roles[2]["name"], roles[4]["name"]),
    (roles[3]["name"], roles[0]["name"]),
    (roles[4]["name"], roles[1]["name"]),
]
review_data = [[Paragraph("Autor del PR", styles["CellHeader"]), Paragraph("Responsable de revisión", styles["CellHeader"])]]
review_data += [[Paragraph(a, styles["Cell"]), Paragraph(b, styles["Cell"])] for a, b in review_pairs]
review_table = Table(review_data, colWidths=[8.45 * cm, 8.45 * cm], repeatRows=1)
review_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("BACKGROUND", (0, 1), (-1, -1), LIGHT),
    ("GRID", (0, 0), (-1, -1), 0.6, MID),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [review_table, Spacer(1, 0.55 * cm), Paragraph("Contenido mínimo de cada pull request", styles["H2x"])]
for item in [
    "Título claro y descripción del cambio realizado.",
    "Referencia al issue mediante Closes #número.",
    "Capturas, pruebas o resultados cuando corresponda.",
    "Comentarios técnicos o documentales del revisor.",
    "Correcciones publicadas en la misma rama.",
    "Aprobación de una persona distinta del autor.",
]:
    story.append(Paragraph(item, styles["Bulletx"], bulletText="•"))

story += [Spacer(1, 0.45 * cm), Paragraph("Responsabilidades compartidas", styles["H2x"])]
for item in [
    "Publicarán sus avances en el repositorio remoto al finalizar cada jornada de trabajo.",
    "Mantendrán actualizada la tarjeta correspondiente en el tablero.",
    "Participarán en las reuniones, reviews, retrospectivas y actas.",
    "Probarán juntos el flujo completo antes de publicar la versión.",
    "Verificarán el release v1.0.0 sobre main, con notas de versión.",
    "Prepararán la demostración de diez minutos y responderán preguntas sobre cualquier parte del proyecto.",
]:
    story.append(Paragraph(item, styles["Bulletx"], bulletText="•"))

story += [Spacer(1, 0.5 * cm), Paragraph("Criterio de cierre", styles["H2x"]), Paragraph("Una actividad se considerará terminada únicamente cuando su issue esté enlazado con la rama y el pull request, las pruebas hayan sido registradas, el revisor haya aprobado los cambios y la tarjeta se encuentre en Hecho.", styles["Bodyx"])]

doc.build(story)
print(OUTPUT)
