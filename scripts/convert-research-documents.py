from __future__ import annotations

from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from docx import Document
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "document"
FONT = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def word_paragraphs(path: Path) -> list[tuple[str, str]]:
    if path.suffix.lower() == ".docx":
        document = Document(path)
        return [(paragraph.text.strip(), paragraph.style.name) for paragraph in document.paragraphs if paragraph.text.strip()]

    with ZipFile(path) as archive:
        xml = archive.read("word/document.xml")
    root = ET.fromstring(xml)
    paragraphs: list[tuple[str, str]] = []
    for node in root.findall(".//w:body/w:p", NS):
        text = "".join(run.text or "" for run in node.findall(".//w:t", NS)).strip()
        if text:
            paragraphs.append((text, "Normal"))
    return paragraphs


def is_heading(text: str, style: str) -> bool:
    if "heading" in style.lower() or "title" in style.lower():
        return True
    if len(text) < 100 and (text[:1].isdigit() and "." in text[:5] or text.isupper()):
        return True
    return False


def footer(canvas, document):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#dbe5f0"))
    canvas.line(22 * mm, 15 * mm, A4[0] - 22 * mm, 15 * mm)
    canvas.setFont("ResearchSans", 8)
    canvas.setFillColor(colors.HexColor("#526174"))
    canvas.drawString(22 * mm, 9.5 * mm, "Hub of Knowledge & Enlightenment Consultancy Firm")
    canvas.drawRightString(A4[0] - 22 * mm, 9.5 * mm, f"Page {document.page}")
    canvas.restoreState()


def create_pdf(source: Path, destination: Path):
    title = source.stem.replace("_", " ")
    paragraphs = word_paragraphs(source)
    document = SimpleDocTemplate(str(destination), pagesize=A4, rightMargin=22 * mm, leftMargin=22 * mm, topMargin=23 * mm, bottomMargin=23 * mm, title=title, author="Hub of Knowledge & Enlightenment Consultancy Firm")
    styles = getSampleStyleSheet()
    normal = ParagraphStyle("ResearchBody", parent=styles["BodyText"], fontName="ResearchSans", fontSize=10.2, leading=15.6, alignment=TA_JUSTIFY, textColor=colors.HexColor("#1f2937"), spaceAfter=8)
    heading = ParagraphStyle("ResearchHeading", parent=styles["Heading2"], fontName="ResearchSansBold", fontSize=13, leading=17, textColor=colors.HexColor("#062f5f"), spaceBefore=13, spaceAfter=7)
    title_style = ParagraphStyle("ResearchTitle", parent=styles["Title"], fontName="ResearchSansBold", fontSize=19, leading=24, alignment=TA_CENTER, textColor=colors.HexColor("#062f5f"), spaceAfter=9)
    subtitle = ParagraphStyle("ResearchSubtitle", parent=styles["BodyText"], fontName="ResearchSans", fontSize=10, leading=14, alignment=TA_CENTER, textColor=colors.HexColor("#526174"), spaceAfter=18)
    story = [Paragraph(title, title_style), Paragraph("Publication PDF", subtitle)]
    first = True
    for text, style_name in paragraphs:
        safe_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
        if first:
            first = False
            continue
        if is_heading(text, style_name):
            story.append(Paragraph(safe_text, heading))
        else:
            story.append(Paragraph(safe_text, normal))
    document.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    pdfmetrics.registerFont(TTFont("ResearchSans", str(FONT)))
    pdfmetrics.registerFont(TTFont("ResearchSansBold", str(FONT_BOLD)))
    for source, destination in [
        (SOURCE / "POLICY BRIEF.docx", SOURCE / "policy-brief.pdf"),
        (SOURCE / "QUALITY ASSURANCE WORKING PAPER.docm", SOURCE / "quality-assurance-working-paper.pdf"),
    ]:
        create_pdf(source, destination)
        print(destination)


if __name__ == "__main__":
    main()
