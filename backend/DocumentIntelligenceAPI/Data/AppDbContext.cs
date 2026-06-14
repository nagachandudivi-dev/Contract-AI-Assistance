using Microsoft.EntityFrameworkCore;
using DocumentIntelligenceAPI.Models;

namespace DocumentIntelligenceAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<ExtractedPage> ExtractedPages => Set<ExtractedPage>();
    public DbSet<Chunk> Chunks => Set<Chunk>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<AnswerCitation> AnswerCitations => Set<AnswerCitation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ExtractedPage>()
            .HasOne(ep => ep.Document)
            .WithMany(d => d.ExtractedPages)
            .HasForeignKey(ep => ep.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Chunk>()
            .HasOne(c => c.Document)
            .WithMany(d => d.Chunks)
            .HasForeignKey(c => c.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Answer>()
            .HasOne(a => a.Question)
            .WithMany(q => q.Answers)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AnswerCitation>()
            .HasOne(ac => ac.Answer)
            .WithMany(a => a.Citations)
            .HasForeignKey(ac => ac.AnswerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AnswerCitation>()
            .HasOne(ac => ac.Document)
            .WithMany(d => d.AnswerCitations)
            .HasForeignKey(ac => ac.DocumentId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<AnswerCitation>()
            .HasOne(ac => ac.Chunk)
            .WithMany(c => c.AnswerCitations)
            .HasForeignKey(ac => ac.ChunkId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
